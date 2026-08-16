import getAuthorizedMusicKitInstance from './musicKitAuth';
import matchSongsToAppleMusic, { cacheKey, searchTitle } from './songMatcher';

// The search itself strips Billboard's `(From "Movie")` soundtrack suffix before querying Apple
// (see songMatcher.js), but Apple's own title for the matched track may or may not carry an
// equivalent suffix - stripping it from both sides here means a mismatch on that one detail alone
// can't cause the text-based dedup check to miss what's really the same song.
const textKeyFor = (title, artist) => cacheKey({ song_title: searchTitle(title), artist_name: artist });

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
// when the matcher would add it via the other route. A 'songs'-type item's own id already IS its
// catalog id (that's what makes it a catalog resource in the first place), so it falls back to
// that instead of the (library-item-only) playParams.catalogId field.
const identityOf = (item) => {
    const catalogId = item.catalogId || (item.type === 'songs' ? item.id : null);
    return catalogId ? `catalog:${catalogId}` : `${item.type}:${item.id}`;
};

async function fetchExistingPlaylistTrackIdentities(instance, playlistId, onProgress) {
    const identities = new Set();
    // Id-based identity depends on Apple consistently populating catalogId/type the same way our
    // own matcher does, which hasn't proven reliable in testing - falling back to a normalized
    // title+artist comparison (the same one used to dedupe the input selection) catches the same
    // real-world song even when the two sides disagree on ids.
    const textKeys = new Set();
    let offset = 0;
    for (let page = 0; page < MAX_PLAYLIST_TRACK_PAGES; page += 1) {
        // Explicitly bypasses any HTTP-level caching (browser or MusicKit) for this specific
        // request - it's queried with the same URL on every run in a session, and stale results
        // here would make dedup silently blind to anything added or cleaned up since the first
        // time that URL was fetched, regardless of how correct the comparison logic itself is.
        const response = await instance.api.music(`/v1/me/library/playlists/${playlistId}/tracks`, {
            limit: PLAYLIST_TRACKS_PAGE_SIZE,
            offset,
        }, {
            fetchOptions: { cache: 'no-store' },
        });
        const items = response?.data?.data || [];
        items.forEach((item) => {
            identities.add(identityOf({
                type: item.type,
                id: item.id,
                catalogId: item?.attributes?.playParams?.catalogId || null,
            }));
            textKeys.add(textKeyFor(item?.attributes?.name, item?.attributes?.artistName));
        });
        if (onProgress)
            onProgress({ completed: identities.size });
        if (items.length < PLAYLIST_TRACKS_PAGE_SIZE)
            break;
        offset += PLAYLIST_TRACKS_PAGE_SIZE;
    }
    return { identities, textKeys };
}

export async function createAppleMusicPlaylist({ playlistName, targetPlaylistId, songs, preferClean = true, onProgress }) {
    const instance = await getAuthorizedMusicKitInstance();

    // Only an existing playlist can already have tracks on it - a newly created one starts empty,
    // so there's nothing to dedupe against. Checked before any searching happens (not after) - a
    // fresh search for a song already on the playlist can legitimately land on a different-but-
    // equally-valid catalog edition (single vs album version, remaster vs original) than whatever
    // was matched last time, which would defeat even a post-hoc id/text comparison between the two
    // independently-resolved results. Skipping the search entirely for anything already present by
    // title+artist avoids that risk by construction, rather than trying to reconcile it afterward.
    let existingIdentities = new Set();
    let existingTextKeys = new Set();
    if (targetPlaylistId) {
        try {
            const existing = await fetchExistingPlaylistTrackIdentities(instance, targetPlaylistId, (progress) =>
                onProgress && onProgress({ stage: 'checking-playlist', ...progress })
            );
            existingIdentities = existing.identities;
            existingTextKeys = existing.textKeys;
        } catch (err) {
            if (process.env.NODE_ENV !== 'production')
                console.warn('Could not fetch existing playlist tracks; duplicates may not be filtered.', err);
        }
    }

    let alreadyOnPlaylistCount = 0;
    const songsToMatch = [];
    songs.forEach((song) => {
        if (existingTextKeys.has(textKeyFor(song.song_title, song.artist_name)))
            alreadyOnPlaylistCount += 1;
        else
            songsToMatch.push(song);
    });

    const { matched, unmatched } = await matchSongsToAppleMusic(instance, songsToMatch, {
        preferClean,
        onProgress: (progress) => onProgress && onProgress({ stage: 'matching', ...progress }),
    });

    // A song can appear multiple times in `songs` (e.g. one row per week it charted), so matching
    // can legitimately produce the same Apple Music track more than once in `matched`. Track what's
    // been queued in this run, not just what's already on the playlist, so a newly-matched song
    // that recurs across many chart weeks gets added once instead of once per recurrence. Still
    // checked against both id and text here too, as a second line of defense for anything the
    // pre-filter above didn't catch (e.g. a title/artist spelling too different from what's
    // already on the playlist for the text-key match to line up).
    const toAdd = [];
    let duplicateCount = alreadyOnPlaylistCount;
    const queuedIdentities = new Set();
    const queuedTextKeys = new Set();
    matched.forEach((m) => {
        const identity = identityOf({ type: m.type, id: m.appleMusicId, catalogId: m.catalogId });
        const textKey = textKeyFor(m.song.song_title, m.song.artist_name);
        const isDuplicate = existingIdentities.has(identity) || existingTextKeys.has(textKey)
            || queuedIdentities.has(identity) || queuedTextKeys.has(textKey);
        if (isDuplicate) {
            duplicateCount += 1;
        } else {
            queuedIdentities.add(identity);
            queuedTextKeys.add(textKey);
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
        createdNewPlaylist: !targetPlaylistId,
        totalSelected: songs.length,
        addedCount: toAdd.length,
        duplicateCount,
        foundInLibraryCount,
        addedToLibraryCount,
        // Everything now known to be on the playlist (already there, plus this run's additions) -
        // carried along so a later manual "add this candidate" pick (see addCandidateToPlaylist)
        // can check against it instead of blindly posting. Arrays, not Sets, so this survives the
        // JSON round-trip through sessionStorage (see CreatePlaylistModal.js).
        playlistKnownIdentities: [...existingIdentities, ...queuedIdentities],
        playlistKnownTextKeys: [...existingTextKeys, ...queuedTextKeys],
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
// batch. Checks the same known-identity data the main run computed (see createAppleMusicPlaylist
// above) before posting, so picking a candidate that turns out to already be on the playlist
// (under a different id/route) doesn't create a fresh duplicate.
export async function addCandidateToPlaylist(playlistId, candidate, knownIdentities = [], knownTextKeys = []) {
    const identity = identityOf({ type: 'songs', id: candidate.id, catalogId: candidate.id });
    const textKey = textKeyFor(candidate.name, candidate.artistName);
    if (knownIdentities.includes(identity) || knownTextKeys.includes(textKey))
        return { added: false, alreadyOnPlaylist: true, identity, textKey };

    const instance = await getAuthorizedMusicKitInstance();
    await instance.api.music(`/v1/me/library/playlists/${playlistId}/tracks`, {}, {
        fetchOptions: {
            method: 'POST',
            body: JSON.stringify({ data: [{ id: candidate.id, type: 'songs' }] }),
        },
    });
    return { added: true, alreadyOnPlaylist: false, identity, textKey };
}

export default createAppleMusicPlaylist;
