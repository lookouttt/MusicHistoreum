async function getTestResponse() {
    const response = await fetch("http://localhost:5000/chart/1/Song/Week/1989-11-11")
    // .then((response) => response.json())
    // .then((actualData) => {
    //     console.log(actualData);
    //     return actualData;
    // })
    // .catch((err) => {
    //     console.log(err.message);
    // });
    console.log("This is a test");
    const data = await response.json();
    console.log("1-" + JSON.stringify(data));
    console.log("2-" + JSON.stringify(data[0].get_weekly_song_chart));
    return(data[0].get_weekly_song_chart);
}

export default getTestResponse;