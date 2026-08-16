import getAuthorizedMusicKitInstance from './musicKitAuth';
import matchSongsToAppleMusic from './songMatcher';

const MAX_TRACKS_PER_REQUEST = 100;
const PLAYLIST_TRACKS_PAGE_SIZE = 100;
// A generous ceiling (10M tracks) purely as a backstop against an unbounded loop if pagination
// ever stops advancing (e.g. a caching layer returning the same page for every offset) - normal
// playlists finish in a handful of pages, this should never be hit in practice.
const MAX_PLAYLIST_TRACK_PAGES = 100000;

// A playlist track can be identified by its catalog id (present whenever the item has a catalog
// counterpart - both a straight catalog addition and a matched library upload carry one) or, for
// a plain library upload with no catalog match, only by its own library id. Comparing on catalog
// id first means a song already on the playlist via one route is still recognized as a duplicate
// when the matcher would add it via the other route.
const identityOf = (item) => (item.catalogId ? `catalog:${item.catalogId}` : `${item.type}:${item.id}`);

async function fetchExistingPlaylistTrackIdentities(instance, playlistId, onProgress) {
    const identities = new Set();
    let offset = 0;
    for (let page = 0; page < MAX_PLAYLIST_TRACK_PAGES; page += 1) {
        const response = await instance.api.music(`/v1/me/library/playlists/${playlistId}/tracks`, {
            limit: PLAYLIST_TRACKS_PAGE_SIZE,
            offset,
        });
        const items = response?.data?.data || [];
        items.forEach((item) => {
            identities.add(identityOf({
                type: item.type,
                id: item.id,
                catalogId: item?.attributes?.playParams?.catalogId || null,
            }));
        });
        if (onProgress)
            onProgress({ completed: identities.size });
        if (items.length < PLAYLIST_TRACKS_PAGE_SIZE)
            break;
        offset += PLAYLIST_TRACKS_PAGE_SIZE;
    }
    return identities;
}

export async function createAppleMusicPlaylist({ playlistName, targetPlaylistId, songs, preferClean = true, onProgress }) {
    const instance = await getAuthorizedMusicKitInstance();

    const { matched, unmatched } = await matchSongsToAppleMusic(instance, songs, {
        preferClean,
        onProgress: (progress) => onProgress && onProgress({ stage: 'matching', ...progress }),
    });

    // Only an existing playlist can already have tracks on it - a newly created one starts empty,
    // so there's nothing to dedupe against.
    let existingIdentities = new Set();
    if (targetPlaylistId) {
        try {
            existingIdentities = await fetchExistingPlaylistTrackIdentities(instance, targetPlaylistId, (progress) =>
                onProgress && onProgress({ stage: 'checking-playlist', ...progress })
            );
        } catch (err) {
            if (process.env.NODE_ENV !== 'production')
                console.warn('Could not fetch existing playlist tracks; duplicates may not be filtered.', err);
        }
    }

    // A song can appear multiple times in `songs` (e.g. one row per week it charted), so matching
    // can legitimately produce the same Apple Music track more than once in `matched`. Track what's
    // been queued in this run, not just what's already on the playlist, so a newly-matched song
    // that recurs across many chart weeks gets added once instead of once per recurrence.
    const toAdd = [];
    let duplicateCount = 0;
    const queuedThisRun = new Set();
    matched.forEach((m) => {
        const identity = identityOf({ type: m.type, id: m.appleMusicId, catalogId: m.catalogId });
        if (existingIdentities.has(identity) || queuedThisRun.has(identity)) {
            duplicateCount += 1;
        } else {
            queuedThisRun.add(identity);
            toAdd.push(m);
        }
    });

    let playlistId = targetPlaylistId;
    if (!playlistId) {
        const playlistResponse = await instance.api.music('/v1/me/library/playlists', {}, {
            fetchOptions: {
                method: 'POST',
                body: JSON.stringify({ attributes: { name: playlistName } }),
            },
        });
        playlistId = playlistResponse?.data?.data?.[0]?.id;
    }

    if (playlistId && toAdd.length > 0) {
        // Apple's API only accepts up to 100 tracks per request -- batch through all of them,
        // not just the first 100 (that used to be a silent cap; harmless when selections rarely
        // exceeded 100, but "Select All" on the annual top songs page can select thousands).
        for (let i = 0; i < toAdd.length; i += MAX_TRACKS_PER_REQUEST) {
            const trackBatch = toAdd.slice(i, i + MAX_TRACKS_PER_REQUEST);
            await instance.api.music(`/v1/me/library/playlists/${playlistId}/tracks`, {}, {
                fetchOptions: {
                    method: 'POST',
                    body: JSON.stringify({
                        data: trackBatch.map((m) => ({ id: m.appleMusicId, type: m.type || 'songs' })),
                    }),
                },
            });
            if (onProgress) {
                onProgress({ stage: 'adding', completed: Math.min(i + MAX_TRACKS_PER_REQUEST, toAdd.length), total: toAdd.length });
            }
        }
    }

    // "Found in library" covers the whole selection - it's independent of whether a song ended up
    // getting added to the playlist or skipped as an existing duplicate. "Added to library" only
    // covers this run's actual additions: a library-songs match was already in the library, so
    // only the songs-type (catalog) additions represent something newly added to it.
    const foundInLibraryCount = matched.filter((m) => m.type === 'library-songs').length;
    const addedToLibraryCount = toAdd.filter((m) => m.type === 'songs').length;

    return {
        playlistName: playlistName || null,
        targetPlaylistId: playlistId,
        totalSelected: songs.length,
        addedCount: toAdd.length,
        duplicateCount,
        foundInLibraryCount,
        addedToLibraryCount,
        unmatched: unmatched.map(({ song, reason, candidates }) => ({
            title: `${song.song_title} — ${song.artist_name}`,
            reason,
            candidates: candidates || [],
        })),
    };
}

// Lets a person add a specific catalog track to an already-created playlist after the fact -
// used for manually resolving an unmatched song from its list of candidates (see songMatcher.js's
// "Found catalog results, but none matched this artist name" case) without rerunning the whole
// batch.
export async function addCandidateToPlaylist(playlistId, candidateId) {
    const instance = await getAuthorizedMusicKitInstance();
    await instance.api.music(`/v1/me/library/playlists/${playlistId}/tracks`, {}, {
        fetchOptions: {
            method: 'POST',
            body: JSON.stringify({ data: [{ id: candidateId, type: 'songs' }] }),
        },
    });
}

export default createAppleMusicPlaylist;
