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

const artistsLooselyMatch = (ourArtist, candidateArtist) => {
    const ourFull = normalize(ourArtist);
    const candidateFull = normalize(candidateArtist);
    if (!ourFull || !candidateFull)
        return false;
    if (ourFull.includes(candidateFull) || candidateFull.includes(ourFull))
        return true;

    const ourPrimary = normalize(primaryArtist(ourArtist));
    const candidatePrimary = normalize(primaryArtist(candidateArtist));
    if (!ourPrimary || !candidatePrimary)
        return false;
    return ourPrimary.includes(candidatePrimary) || candidatePrimary.includes(ourPrimary);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
async function findLibraryMatch(instance, song, { preferClean = true } = {}) {
    const term = `${song.song_title} ${primaryArtist(song.artist_name)}`;
    const results = await searchLibrary(instance, term);

    const candidates = results?.data?.results?.['library-songs']?.data || [];
    const artistMatches = candidates.filter((candidate) =>
        artistsLooselyMatch(song.artist_name, candidate?.attributes?.artistName)
    );

    if (artistMatches.length === 0)
        return null;

    if (preferClean) {
        const cleanMatch = artistMatches.find((candidate) => candidate?.attributes?.contentRating !== 'explicit');
        if (cleanMatch)
            return cleanMatch.id;
    }

    return artistMatches[0].id;
}

async function findBestMatch(instance, song, { preferClean = true } = {}) {
    const libraryId = await findLibraryMatch(instance, song, { preferClean });
    if (libraryId)
        return { appleMusicId: libraryId, type: 'library-songs', reason: null };

    const term = `${song.song_title} ${primaryArtist(song.artist_name)}`;
    const results = await searchCatalog(instance, term);

    const candidates = results?.data?.results?.songs?.data || [];
    const artistMatches = candidates.filter((candidate) =>
        artistsLooselyMatch(song.artist_name, candidate?.attributes?.artistName)
    );

    if (artistMatches.length === 0)
        return { appleMusicId: null, type: null, reason: 'No catalog match found for this song/artist.' };

    if (preferClean) {
        const cleanMatch = artistMatches.find((candidate) => candidate?.attributes?.contentRating !== 'explicit');
        if (cleanMatch)
            return { appleMusicId: cleanMatch.id, type: 'songs', reason: null };
    }

    return { appleMusicId: artistMatches[0].id, type: 'songs', reason: null };
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

export async function matchSongsToAppleMusic(instance, songs, { concurrency = 5, preferClean = true, onProgress } = {}) {
    // Indexed by each song's original position so chart order survives concurrent,
    // out-of-order completion, rather than following whichever search resolves first.
    const resultsByIndex = new Array(songs.length);
    let completed = 0;
    let nextIndex = 0;

    const runWorker = async () => {
        while (nextIndex < songs.length) {
            const index = nextIndex;
            nextIndex += 1;
            const song = songs[index];
            const key = cacheKey(song);

            let outcome = matchCache.get(key);
            if (!outcome) {
                try {
                    outcome = await findBestMatch(instance, song, { preferClean });
                } catch (err) {
                    if (process.env.NODE_ENV !== 'production')
                        console.warn(`Apple Music search failed for "${song.song_title}" by ${song.artist_name}:`, err);
                    outcome = { appleMusicId: null, reason: 'Apple Music search failed for this song.' };
                }
                matchCache.set(key, outcome);
            }
            resultsByIndex[index] = outcome.appleMusicId
                ? { song, appleMusicId: outcome.appleMusicId, type: outcome.type }
                : { song, reason: outcome.reason };

            completed += 1;
            if (onProgress)
                onProgress({ completed, total: songs.length });
        }
    };

    const workerCount = Math.min(concurrency, songs.length) || 1;
    await Promise.all(Array.from({ length: workerCount }, runWorker));

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
