const normalize = (str) => String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// Billboard's artist_name often lists collaborators ("X Featuring Y", "X & Y"); Apple's
// catalog artistName is usually just the primary artist, so split on the raw string
// (before punctuation is stripped) to isolate the primary artist for matching/searching.
const ARTIST_SEPARATOR_REGEX = /\s*(?:,|&|\/|\bx\b|\bvs\.?\b|\bfeaturing\b|\bfeat\.?\b|\bft\.?\b|\bwith\b|\band\b)\s*/i;

const primaryArtist = (str) => String(str || '').split(ARTIST_SEPARATOR_REGEX)[0].trim();

// Squashed (no-space) name -> squashed name, for the handful of legal/stylistic renames that no
// generic normalization catches (Ke$ha dropped the stylization for "Kesha" on Apple Music; Dixie
// Chicks rebranded to The Chicks in 2020). Keyed/valued on the squashed form so a spacing
// difference between the two spellings doesn't also need to be special-cased here.
const ARTIST_ALIASES = new Map([
    ['keha', 'kesha'],
    ['dixiechicks', 'thechicks'],
]);

const squash = (normalized) => normalized.replace(/\s+/g, '');

const canonicalArtist = (str) => {
    const squashed = squash(normalize(str));
    return ARTIST_ALIASES.get(squashed) || squashed;
};

const tokenize = (normalized) => normalized.split(' ').filter(Boolean);

// True when every token of the shorter name shows up in the longer name, in order (extra tokens
// in between are fine) - catches cases like the Billboard-era "Missy 'Misdemeanor' Elliott"
// matching Apple's plain "Missy Elliott" without needing to know every possible inserted nickname,
// and "'N Sync" (kept as two words) matching Apple's "*NSYNC" (squashed to one) via canonicalArtist.
const isTokenSubsequence = (shortTokens, longTokens) => {
    let i = 0;
    for (const token of longTokens) {
        if (token === shortTokens[i])
            i += 1;
        if (i === shortTokens.length)
            return true;
    }
    return shortTokens.length === 0;
};

const namesLooselyMatch = (a, b) => {
    const normA = normalize(a);
    const normB = normalize(b);
    if (!normA || !normB)
        return false;
    if (canonicalArtist(a) === canonicalArtist(b))
        return true;

    // Loose substring check first - catches single-character spelling differences within a token
    // (e.g. Apple's accented "Beyoncé" normalizes to "beyonc", one letter short of "beyonce")
    // that the stricter whole-token comparison below would otherwise reject.
    if (normA.includes(normB) || normB.includes(normA))
        return true;

    const tokensA = tokenize(normA);
    const tokensB = tokenize(normB);
    return isTokenSubsequence(tokensA, tokensB) || isTokenSubsequence(tokensB, tokensA);
};

const artistsLooselyMatch = (ourArtist, candidateArtist) =>
    namesLooselyMatch(ourArtist, candidateArtist)
    || namesLooselyMatch(primaryArtist(ourArtist), primaryArtist(candidateArtist));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRateLimitError = (err) => {
    const status = err?.status ?? err?.response?.status ?? err?.httpStatus;
    if (status === 429)
        return true;
    return /\b429\b/.test(String(err?.message || ''));
};

async function searchCatalog(instance, term, attempt = 0) {
    try {
        return await instance.api.music(`/v1/catalog/${instance.storefrontId}/search`, {
            term,
            types: 'songs',
            limit: 10,
        });
    } catch (err) {
        // Apple's catalog search occasionally rate-limits concurrent requests (429) or
        // hiccups transiently; retry a couple times before giving up on this song.
        if (attempt >= 2)
            throw err;
        await sleep(300 * (attempt + 1));
        return searchCatalog(instance, term, attempt + 1);
    }
}

async function searchLibrary(instance, term, attempt = 0) {
    try {
        return await instance.api.music('/v1/me/library/search', {
            term,
            types: 'library-songs',
            limit: 10,
        });
    } catch (err) {
        if (attempt >= 2)
            throw err;
        await sleep(300 * (attempt + 1));
        return searchLibrary(instance, term, attempt + 1);
    }
}

// Apple Music/Uploaded/Matched songs all show up here identically (library search doesn't
// expose which one), so any result is a valid "the user already owns this" match. Library-song
// ids work directly on the playlist-tracks endpoint, so a hit here skips the catalog search below.
// Also surfaces the library item's catalogId (present for Apple Music additions and matched
// uploads, absent for plain uploads) so callers can dedupe against a playlist's existing tracks
// by catalog identity, not just by which of the two id spaces a track happened to be added under.
async function findLibraryMatch(instance, song, { preferClean = true } = {}) {
    const term = `${song.song_title} ${primaryArtist(song.artist_name)}`;
    const results = await searchLibrary(instance, term);

    const candidates = results?.data?.results?.['library-songs']?.data || [];
    const artistMatches = candidates.filter((candidate) =>
        artistsLooselyMatch(song.artist_name, candidate?.attributes?.artistName)
    );

    if (artistMatches.length === 0)
        return null;

    const pick = (preferClean && artistMatches.find((candidate) => candidate?.attributes?.contentRating !== 'explicit'))
        || artistMatches[0];
    return { id: pick.id, catalogId: pick?.attributes?.playParams?.catalogId || null };
}

async function findBestMatch(instance, song, { preferClean = true } = {}) {
    const libraryMatch = await findLibraryMatch(instance, song, { preferClean });
    if (libraryMatch)
        return { appleMusicId: libraryMatch.id, type: 'library-songs', catalogId: libraryMatch.catalogId, reason: null, retryable: false };

    const term = `${song.song_title} ${primaryArtist(song.artist_name)}`;
    const results = await searchCatalog(instance, term);

    const candidates = results?.data?.results?.songs?.data || [];
    const artistMatches = candidates.filter((candidate) =>
        artistsLooselyMatch(song.artist_name, candidate?.attributes?.artistName)
    );

    if (artistMatches.length === 0) {
        // A completely empty result set for a title search is often a symptom of Apple
        // throttling the request rather than a genuine "not on Apple Music" - worth an automatic
        // retry (see the retry pass in matchSongsToAppleMusic). Getting candidates back but none
        // matching the artist means the search itself worked fine, so that's a real mismatch and
        // retrying won't change the outcome.
        return candidates.length === 0
            ? { appleMusicId: null, type: null, reason: 'Apple Music search returned no results for this title.', retryable: true }
            : { appleMusicId: null, type: null, reason: 'Found catalog results, but none matched this artist name.', retryable: false };
    }

    if (preferClean) {
        const cleanMatch = artistMatches.find((candidate) => candidate?.attributes?.contentRating !== 'explicit');
        if (cleanMatch)
            return { appleMusicId: cleanMatch.id, type: 'songs', catalogId: cleanMatch.id, reason: null, retryable: false };
    }

    return { appleMusicId: artistMatches[0].id, type: 'songs', catalogId: artistMatches[0].id, reason: null, retryable: false };
}

// Keyed by normalized title+artist so the same song appearing multiple times in one batch
// (common across years/charts on the Annual Top Songs page) only triggers one catalog search.
// Persists across calls for the lifetime of the page, not just within a single batch. Stores
// the unmatch reason alongside the id (not just the matched result) so a future per-song
// "why didn't this match" UI can look it up regardless of which occurrence actually made the
// network call - otherwise that reason would only reflect the first occurrence and silently go
// stale for deduped lookups.
const matchCache = new Map();
const cacheKey = (song) => `${normalize(song.song_title)}::${normalize(song.artist_name)}`;

export async function matchSongsToAppleMusic(instance, songs, { concurrency = 5, preferClean = true, onProgress, maxRateLimitRetries = 2 } = {}) {
    // Indexed by each song's original position so chart order survives concurrent,
    // out-of-order completion, rather than following whichever search resolves first.
    const resultsByIndex = new Array(songs.length);
    let completed = 0;

    const runPass = async (indices, passConcurrency) => {
        let cursor = 0;
        const runWorker = async () => {
            while (cursor < indices.length) {
                const index = indices[cursor];
                cursor += 1;
                const song = songs[index];
                const key = cacheKey(song);

                let outcome = matchCache.get(key);
                if (!outcome) {
                    try {
                        outcome = await findBestMatch(instance, song, { preferClean });
                    } catch (err) {
                        if (process.env.NODE_ENV !== 'production')
                            console.warn(`Apple Music search failed for "${song.song_title}" by ${song.artist_name}:`, err);
                        outcome = {
                            appleMusicId: null,
                            type: null,
                            reason: isRateLimitError(err)
                                ? 'Apple Music rate-limited this search.'
                                : 'Apple Music search failed for this song.',
                            retryable: isRateLimitError(err),
                        };
                    }
                    matchCache.set(key, outcome);
                }
                resultsByIndex[index] = outcome.appleMusicId
                    ? { song, appleMusicId: outcome.appleMusicId, type: outcome.type, catalogId: outcome.catalogId || null }
                    : { song, reason: outcome.reason, retryable: !!outcome.retryable };

                completed += 1;
                if (onProgress)
                    onProgress({ completed: Math.min(completed, songs.length), total: songs.length });
            }
        };

        const workerCount = Math.min(passConcurrency, indices.length) || 1;
        await Promise.all(Array.from({ length: workerCount }, runWorker));
    };

    await runPass(songs.map((_, index) => index), concurrency);

    // Rate-limited (or rate-limit-shaped) misses failed for reasons unrelated to whether the song
    // is really on Apple Music - once the initial burst of requests has had a moment to clear,
    // it's worth one or two more tries, at lower concurrency so the retry doesn't just trip the
    // same limit again, before giving up on them for good.
    for (let round = 1; round <= maxRateLimitRetries; round += 1) {
        const retryIndices = resultsByIndex.reduce((acc, result, index) => {
            if (result?.retryable)
                acc.push(index);
            return acc;
        }, []);
        if (retryIndices.length === 0)
            break;

        await sleep(1500 * round);
        retryIndices.forEach((index) => matchCache.delete(cacheKey(songs[index])));
        await runPass(retryIndices, Math.max(1, Math.floor(concurrency / 2)));
    }

    const matched = [];
    const unmatched = [];
    resultsByIndex.forEach((result) => {
        if (result.appleMusicId)
            matched.push(result);
        else
            unmatched.push({ song: result.song, reason: result.reason });
    });

    return { matched, unmatched };
}

export default matchSongsToAppleMusic;
