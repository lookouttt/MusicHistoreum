// Lists the signed-in user's existing Apple Music library playlists, so CreatePlaylistModal
// can offer "add to an existing playlist" instead of always creating a new one. Fetches only
// the first page (Apple's API caps a single request at 100) -- fine for picking a playlist to
// add to, not meant to be an exhaustive library browser.
export async function fetchLibraryPlaylists(instance) {
    const response = await instance.api.music('/v1/me/library/playlists', { limit: 100 });
    const data = response?.data?.data || [];
    return data.map((playlist) => ({
        id: playlist.id,
        name: playlist.attributes?.name || 'Untitled Playlist',
    }));
}

export default fetchLibraryPlaylists;
