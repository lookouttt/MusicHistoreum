// Strips accents/diacritics via Unicode decomposition (e.g. "é" -> "e" + a combining accent
// mark, then the mark is dropped) rather than deleting the accented character outright. Deleting
// it instead of transliterating it is what broke "Céline Dion" -> "celine dion": losing the
// accent from the middle of "Céline" leaves "cline", which isn't even a substring of "celine",
// unlike an accent at the end of a word (e.g. "Beyoncé" -> "beyonc", still a clean prefix).
// Character class below is the Unicode Combining Diacritical Marks block, codepoints 0x300-0x36f.
const stripDiacritics = (str) => str.normalize('NFD').replace(/[̀-ͯ]/g, '');

const normalize = (str) => stripDiacritics(String(str || ''))
    .toLowerCase()
    // "&" is just as often written as "and" in music credits ("Elton John & Britney Spears" vs
    // "...And..."). Converting it instead of deleting it outright (the next line strips it as
    // punctuation) preserves the word so both spellings normalize to the same text - deleting it
    // silently removes an entire word from one side, changing the word count and breaking the
    // match, as opposed to punctuation like "!" or "," where deleting it changes nothing.
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// Billboard's artist_name often lists collaborators ("X Featuring Y", "X & Y"); Apple's
// catalog artistName is usually just the primary artist, so split on the raw string
// (before punctuation is stripped) to isolate the primary artist for matching/searching.
const ARTIST_SEPARATOR_REGEX = /\s*(?:,|&|\/|\bx\b|\bvs\.?\b|\bfeaturing\b|\bfeat\.?\b|\bft\.?\b|\bwith\b|\band\b)\s*/i;

const primaryArtist = (str) => String(str || '').split(ARTIST_SEPARATOR_REGEX)[0].trim();

// Standalone digit tokens -> their spelled-out word, so "The 4 Seasons" lines up with Apple's
// "The Four Seasons" without needing a per-artist alias for every numeral-styled name.
const NUMBER_WORDS = {
    0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
    6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
    11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen',
    16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty',
};

const expandNumberWords = (normalized) => normalized
    .split(' ')
    .map((token) => NUMBER_WORDS[token] ?? token)
    .join(' ');

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
    const squashed = squash(expandNumberWords(normalize(str)));
    return ARTIST_ALIASES.get(squashed) || squashed;
};

const tokenize = (normalized) => expandNumberWords(normalized).split(' ').filter(Boolean);

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

    // Loose substring check first - catches minor spelling differences within a single token
    // (extra/missing letter, abbreviation, etc.) that the stricter whole-token comparison below
    // would otherwise reject.
    if (normA.includes(normB) || normB.includes(normA))
        return true;

    const tokensA = tokenize(normA);
    const tokensB = tokenize(normB);
    return isTokenSubsequence(tokensA, tokensB) || isTokenSubsequence(tokensB, tokensA);
};

export const artistsLooselyMatch = (ourArtist, candidateArtist) =>
    namesLooselyMatch(ourArtist, candidateArtist)
    || namesLooselyMatch(primaryArtist(ourArtist), primaryArtist(candidateArtist));

// Exported for the same loose title comparison used elsewhere in this file (e.g. matching a
// candidate's name against a song's title) - reused by createAppleMusicPlaylist.js's existing-
// playlist fallback check, since a strict comparison can't recognize a song that was only ever
// resolved through a manual candidate pick (see below).
export { namesLooselyMatch };

// Billboard appends a soundtrack/movie attribution like `(From "Top Gun")` to plenty of chart
// titles that Apple's own catalog/library title doesn't carry, and separately, Apple's own title
// for an already-matched track very often carries its own trailing annotation - "(2019 Remaster)",
// "(Single Version)", "(Live)", "[Radio Edit]" - that Billboard's plain title never had. Strips any
// number of trailing parenthesized/bracketed groups (not just soundtrack ones) so a title differing
// only by this kind of annotation isn't treated as a different song, for the search query itself
// and (via callers) for text-based dedup, where a strict match would otherwise miss it entirely.
const TRAILING_ANNOTATION_REGEX = /\s*[([][^()[\]]*[)\]]\s*$/;
export const searchTitle = (title) => {
    let result = String(title || '');
    for (;;) {
        const stripped = result.replace(TRAILING_ANNOTATION_REGEX, '').trim();
        if (!stripped || stripped === result)
            break;
        result = stripped;
    }
    return result || title;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRateLimitError = (err) => {
    const status = err?.status ?? err?.response?.status ?? err?.httpStatus;
    if (status === 429)
        return true;
    return /\b429\b/.test(String(err?.message || ''));
};

// Apple's search API caps out at 25 results per type - asking for the max gives a title+artist
// query the best chance of surfacing the right song even when it ranks well outside the top 10
// (e.g. a cover/medley competing against a much more popular original for the same title words).
const SEARCH_RESULT_LIMIT = 25;

// Bypasses HTTP-level caching (browser or MusicKit) - the same term can legitimately be searched
// again in a later run within the same page session (a song recurring across chart weeks, or the
// same title searched again on a retest), and a stale response would mean a since-added library
// track or since-changed catalog result silently goes unseen.
const NO_CACHE_FETCH_OPTIONS = { fetchOptions: { cache: 'no-store' } };

async function searchCatalog(instance, term, attempt = 0) {
    try {
        return await instance.api.music(`/v1/catalog/${instance.storefrontId}/search`, {
            term,
            types: 'songs',
            limit: SEARCH_RESULT_LIMIT,
        }, NO_CACHE_FETCH_OPTIONS);
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
            limit: SEARCH_RESULT_LIMIT,
        }, NO_CACHE_FETCH_OPTIONS);
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
    const term = `${searchTitle(song.song_title)} ${primaryArtist(song.artist_name)}`;
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

    const term = `${searchTitle(song.song_title)} ${primaryArtist(song.artist_name)}`;
    const results = await searchCatalog(instance, term);

    const candidates = results?.data?.results?.songs?.data || [];
    const artistMatches = candidates.filter((candidate) =>
        artistsLooselyMatch(song.artist_name, candidate?.attributes?.artistName)
    );

    if (artistMatches.length === 0) {
        // A completely empty result set for a title search is often a symptom of Apple
        // throttling the request rather than a genuine "not on Apple Music" - worth an automatic
        // retry (see the retry pass in matchSongsToAppleMusic). Getting candidates back but none
        // matching the artist means the search itself worked fine, so that's a real mismatch - not
        // worth auto-retrying, but worth surfacing the candidates Apple did return so a person can
        // judge whether one of them is actually the right song under a spelling artistsLooselyMatch
        // doesn't catch.
        if (candidates.length === 0)
            return { appleMusicId: null, type: null, reason: 'Apple Music search returned no results for this title.', retryable: true };

        // A title+artist search ranks by title relevance more than artist, so a cover, medley, or
        // otherwise less-searched version can get crowded out of the results entirely by a more
        // popular original/other artist sharing the same title words (e.g. Will to Power's "Baby
        // I Love Your Way/Freebird Medley" losing out to Peter Frampton's and Lynyrd Skynyrd's much
        // more searched originals). A second, artist-only search widens the net for manual review.
        let artistOnlyMatches = [];
        try {
            const artistResults = await searchCatalog(instance, primaryArtist(song.artist_name));
            const artistCandidates = artistResults?.data?.results?.songs?.data || [];
            artistOnlyMatches = artistCandidates.filter((candidate) =>
                namesLooselyMatch(searchTitle(song.song_title), candidate?.attributes?.name)
            );
        } catch (err) {
            // Best-effort widening - fall back to just the title-search candidates if this fails.
        }

        // Apple's relevance ranking blends every word in the title+artist query together, so a
        // strong artist-name match alone can pull in results whose title isn't related at all -
        // filter the raw title-search results down to ones whose title is plausibly the same song
        // too, otherwise the "possible matches" list ends up full of unrelated songs by someone
        // with a similar-looking artist name.
        const titleMatchedCandidates = candidates.filter((candidate) =>
            namesLooselyMatch(searchTitle(song.song_title), candidate?.attributes?.name)
        );

        const combinedCandidates = [...titleMatchedCandidates, ...artistOnlyMatches].filter((candidate, index, all) =>
            all.findIndex((c) => c.id === candidate.id) === index
        );

        return {
            appleMusicId: null,
            type: null,
            reason: 'Found catalog results, but none matched this artist name.',
            retryable: false,
            candidates: combinedCandidates.map((candidate) => ({
                id: candidate.id,
                name: candidate?.attributes?.name || '',
                artistName: candidate?.attributes?.artistName || '',
                albumName: candidate?.attributes?.albumName || '',
                contentRating: candidate?.attributes?.contentRating || null,
            })),
        };
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

// Exported so callers can compute the same key for an Apple-side track (name/artistName) as for
// one of our own songs (song_title/artist_name) - see createAppleMusicPlaylist.js's dedupe-by-text
// checks. Title goes through searchTitle (strips trailing annotations like soundtrack credits or
// "(feat. X)"); artist goes through primaryArtist + canonicalArtist (drops "Featuring X"/"feat. X"
// collaborator credits and folds in the alias/numeral/spacing normalization used for matching).
// Both were previously plain normalize() on the raw strings, which is why this key stayed stricter
// than the actual matching logic and produced a different key for e.g. "Mariah Carey" vs "Mariah
// Carey Featuring Miguel" - the single biggest source of false "not a duplicate" results found by
// comparing a full playlist against its chart selection.
export const cacheKey = (song) =>
    `${normalize(searchTitle(song.song_title))}::${canonicalArtist(primaryArtist(song.artist_name))}`;

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

                // Stores the in-flight promise itself, not just the resolved result - if two
                // workers hit the same key before either finishes (the same song recurring across
                // chart weeks, picked up by different workers), they need to share one search, not
                // each independently race their own. Two independent searches for the same song
                // aren't guaranteed to return the same candidate/edition, which would silently
                // defeat the within-run dedupe in createAppleMusicPlaylist.js (different catalog
                // ids for what's really the same song).
                let outcomePromise = matchCache.get(key);
                if (!outcomePromise) {
                    outcomePromise = findBestMatch(instance, song, { preferClean }).catch((err) => {
                        if (process.env.NODE_ENV !== 'production')
                            console.warn(`Apple Music search failed for "${song.song_title}" by ${song.artist_name}:`, err);
                        return {
                            appleMusicId: null,
                            type: null,
                            reason: isRateLimitError(err)
                                ? 'Apple Music rate-limited this search.'
                                : 'Apple Music search failed for this song.',
                            retryable: isRateLimitError(err),
                        };
                    });
                    matchCache.set(key, outcomePromise);
                }
                const outcome = await outcomePromise;
                resultsByIndex[index] = outcome.appleMusicId
                    ? { song, appleMusicId: outcome.appleMusicId, type: outcome.type, catalogId: outcome.catalogId || null }
                    : { song, reason: outcome.reason, retryable: !!outcome.retryable, candidates: outcome.candidates || [] };

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
    // A song appearing on multiple chart weeks would otherwise show up once per occurrence in the
    // "couldn't be matched" list - collapse those down to one entry per distinct song so a manual
    // pick from the candidate list only needs to happen (and only shows up) once.
    const seenUnmatchedKeys = new Set();
    resultsByIndex.forEach((result) => {
        if (result.appleMusicId) {
            matched.push(result);
            return;
        }
        const key = cacheKey(result.song);
        if (seenUnmatchedKeys.has(key))
            return;
        seenUnmatchedKeys.add(key);
        unmatched.push({ song: result.song, reason: result.reason, candidates: result.candidates || [] });
    });

    return { matched, unmatched };
}

export default matchSongsToAppleMusic;
