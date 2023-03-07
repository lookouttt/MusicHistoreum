import { createSlice } from "@reduxjs/toolkit";
import { SONG_CHARTS } from '../../app/shared/SONG_CHARTS';
import { ALBUM_CHARTS } from '../../app/shared/ALBUM_CHARTS';

const initialState = {
    songChartsArray: SONG_CHARTS,
    albumChartsArray: ALBUM_CHARTS
};

const chartsMenuSlice = createSlice({
    name: 'chartsMenu',
    initialState,
    reducers: {
        updateLastDate: (state, action) => {
            if (action.payload.chartType === "Song") {
                const newIndex = state.songChartsArray.findIndex(chart => chart.ChartId === action.payload.chartId)
                const newChart = [...state.songChartsArray];
                newChart[newIndex].LastDate = action.payload.lastDate;
            }
            if (action.payload.chartType === "Album") {
                const newIndex = state.albumChartsArray.findIndex(chart => chart.ChartId === action.payload.chartId)
                const newChart = [...state.albumChartsArray];
                newChart[newIndex].LastDate = action.payload.lastDate;
            }
        }
    }
});

export const chartsMenuReducer = chartsMenuSlice.reducer;

export const { updateLastDate } = chartsMenuSlice.actions;

export const selectChartsMenu = (chartType) => (state) => {
    if (chartType === 'Song') 
        return state.chartsMenu.songChartsArray;
    else
        return state.chartsMenu.albumChartsArray;
}

export const selectSpecificChart = (chartType, id) => state => {
    if (chartType === 'Song')
        return state.chartsMenu.songChartsArray.find((chart) => chart.ChartId === parseInt(id));
    else
        return state.chartsMenu.albumChartsArray.find((chart) => chart.ChartId === parseInt(id));
}
