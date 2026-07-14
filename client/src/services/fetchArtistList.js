import { baseUrl } from "./baseUrl";

async function fetchArtistList(start_char) {
    const response = await fetch(`${baseUrl}artist/list/${start_char}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch artist list: ${response.status}`);
    }
    const data = await response.json();
    return data[0].get_artist_list;
}

export default fetchArtistList;