import { createSlice } from "@reduxjs/toolkit";
import { SONG_CHARTS } from '../../app/shared/SONG_CHARTS';

const initialState = {
    songChartsArray: SONG_CHARTS
};

const songChartsSlice = createSlice({
    name: 'songCharts',
    initialState
});

export const songChartsReducer = songChartsSlice.reducer;

export const selectSongCharts = (state) => {
    return state.songCharts.songChartsArray;
}
