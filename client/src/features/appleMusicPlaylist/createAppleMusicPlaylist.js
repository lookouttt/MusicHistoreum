import getAuthorizedMusicKitInstance from './musicKitAuth';
import matchSongsToAppleMusic from './songMatcher';

const MAX_TRACKS_PER_REQUEST = 100;

export async function createAppleMusicPlaylist({ playlistName, targetPlaylistId, songs, preferClean = true, onProgress }) {
    const instance = await getAuthorizedMusicKitInstance();

    const { matched, unmatched } = await matchSongsToAppleMusic(instance, songs, {
        preferClean,
        onProgress: (progress) => onProgress && onProgress({ stage: 'matching', ...progress }),
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

    if (playlistId && matched.length > 0) {
        // Apple's API only accepts up to 100 tracks per request -- batch through all of them,
        // not just the first 100 (that used to be a silent cap; harmless when selections rarely
        // exceeded 100, but "Select All" on the annual top songs page can select thousands).
        for (let i = 0; i < matched.length; i += MAX_TRACKS_PER_REQUEST) {
            const trackBatch = matched.slice(i, i + MAX_TRACKS_PER_REQUEST);
            await instance.api.music(`/v1/me/library/playlists/${playlistId}/tracks`, {}, {
                fetchOptions: {
                    method: 'POST',
                    body: JSON.stringify({
                        data: trackBatch.map((m) => ({ id: m.appleMusicId, type: m.type || 'songs' })),
                    }),
                },
            });
            if (onProgress) {
                onProgress({ stage: 'adding', completed: Math.min(i + MAX_TRACKS_PER_REQUEST, matched.length), total: matched.length });
            }
        }
    }

    return {
        playlistName: playlistName || null,
        targetPlaylistId: playlistId,
        totalSelected: songs.length,
        addedCount: matched.length,
        unmatched: unmatched.map(({ song, reason }) => ({
            title: `${song.song_title} — ${song.artist_name}`,
            reason,
        })),
    };
}

export default createAppleMusicPlaylist;
