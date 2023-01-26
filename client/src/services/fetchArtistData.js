async function fetchArtistData(artistToFind, queryType) {
    const response = await fetch(`http://localhost:5000/artist/${artistToFind}/${queryType}`);
    const data = await response.json();
    if (queryType === 'songs')
        return data[0].get_songs_by_artist;
    else
        return data[0].get_albums_by_artist;
}

export default fetchArtistData;