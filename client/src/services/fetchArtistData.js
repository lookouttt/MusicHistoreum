async function fetchArtistData(artist_to_find) {
    console.log('artist: ', artist_to_find);
    const response = await fetch(`http://localhost:5000/artist/${artist_to_find}`);
    const data = await response.json();

    return data[0].get_songs_by_artist;
}

export default fetchArtistData;