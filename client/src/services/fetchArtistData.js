import { baseUrl } from "./baseUrl";

async function fetchArtistData(artistToFind, queryType) {
    const response = await fetch(`${baseUrl}artist/${artistToFind}/${queryType}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch artist data: ${response.status}`);
    }
    const data = await response.json();
    if (queryType === 'songs')
        return data[0].get_songs_by_artist;
    else
        return data[0].get_albums_by_artist;
}

export default fetchArtistData;