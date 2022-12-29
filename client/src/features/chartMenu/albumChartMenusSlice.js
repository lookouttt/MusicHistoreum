import { createSlice } from "@reduxjs/toolkit";
import { ALBUM_CHARTS } from '../../app/shared/ALBUM_CHARTS';

const initialState = {
    albumChartsArray: ALBUM_CHARTS
};

const albumChartsSlice = createSlice({
    name: 'albumCharts',
    initialState
});

export const albumChartsReducer = albumChartsSlice.reducer;

export const selectAlbumCharts = (state) => {
    return state.albumCharts.albumChartsArray;
}
