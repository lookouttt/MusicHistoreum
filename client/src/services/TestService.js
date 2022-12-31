async function getTestResponse({chart}) {
    const { chartId, chartType, chartTimeframe, chartDate } = chart;
    const response = await fetch(`http://localhost:5000/chart/${chartId}/${chartType}/${chartTimeframe}/${chartDate}`);
    const data = await response.json();
    //console.log("2-" + JSON.stringify(data[0].get_weekly_song_chart));
    if (chartType === 'Song') {
        switch (chartTimeframe) {
            case 'Week':
                return data[0].get_weekly_song_chart;
            default:
                return data[0].get_range_song_chart;
        }
    } else {
        switch (chartTimeframe) {
            case 'Week':
                return data[0].get_weekly_album_chart;
            default:
                return data[0].get_range_album_chart;
        }
    }
}

export default getTestResponse;