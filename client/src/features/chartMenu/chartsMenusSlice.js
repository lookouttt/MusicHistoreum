import { createSlice } from "@reduxjs/toolkit";
import { SONG_CHARTS } from '../../app/shared/SONG_CHARTS';
import { ALBUM_CHARTS } from '../../app/shared/ALBUM_CHARTS';

const initialState = {
    songChartsArray: SONG_CHARTS,
    albumChartsArray: ALBUM_CHARTS
};

const chartsMenuSlice = createSlice({
    name: 'chartsMenu',
    initialState
});

export const chartsMenuReducer = chartsMenuSlice.reducer;

export const selectChartsMenu = (chartType) => (state) => {
    if (chartType === 'Song') 
        return state.chartsMenu.songChartsArray;
    else
        return state.chartsMenu.albumChartsArray;
}
