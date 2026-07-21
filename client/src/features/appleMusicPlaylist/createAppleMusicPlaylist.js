import getAuthorizedMusicKitInstance from './musicKitAuth';
import matchSongsToAppleMusic from './songMatcher';

const MAX_TRACKS_PER_REQUEST = 100;

export async function createAppleMusicPlaylist({ playlistName, songs, preferClean = true, onProgress }) {
    const instance = await getAuthorizedMusicKitInstance();

    const { matched, unmatched } = await matchSongsToAppleMusic(instance, songs, {
        preferClean,
        onProgress: (progress) => onProgress && onProgress({ stage: 'matching', ...progress }),
    });

    const playlistResponse = await instance.api.music('/v1/me/library/playlists', {}, {
        fetchOptions: {
            method: 'POST',
            body: JSON.stringify({ attributes: { name: playlistName } }),
        },
    });
    const playlistId = playlistResponse?.data?.data?.[0]?.id;

    if (playlistId && matched.length > 0) {
        const trackBatch = matched.slice(0, MAX_TRACKS_PER_REQUEST);
        await instance.api.music(`/v1/me/library/playlists/${playlistId}/tracks`, {}, {
            fetchOptions: {
                method: 'POST',
                body: JSON.stringify({
                    data: trackBatch.map((m) => ({ id: m.appleMusicId, type: 'songs' })),
                }),
            },
        });
    }

    return {
        playlistName,
        totalSelected: songs.length,
        addedCount: matched.length,
        unmatched: unmatched.map((song) => `${song.song_title} — ${song.artist_name}`),
    };
}

export default createAppleMusicPlaylist;
