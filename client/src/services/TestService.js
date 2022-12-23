async function getTestResponse({chart}) {
    const { chartId, chartType, chartTimeframe, chartDate } = chart;
    const response = await fetch(`http://localhost:5000/chart/${chartId}/${chartType}/${chartTimeframe}/${chartDate}`);
    const data = await response.json();
    //console.log("2-" + JSON.stringify(data[0].get_weekly_song_chart));
    return(data[0].get_weekly_song_chart);
}

export default getTestResponse;