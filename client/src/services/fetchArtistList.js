async function fetchArtistList() {
    const response = await fetch(`http://localhost:5000/artist/list`);
    const data = await response.json();
        return data[0].get_artist_list;
}

export default fetchArtistList;