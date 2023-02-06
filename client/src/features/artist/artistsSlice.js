import { createSlice } from '@reduxjs/toolkit';
import { TOP_ARTISTS } from '../../app/shared/TOP_ARTISTS';

const initialState = {
    topArtists: TOP_ARTISTS,
};

const artistsSlice = createSlice({
    name: 'artists',
    initialState
});



export const artistsReducer = artistsSlice.reducer;

export const getTopArtists = () =>  (state) => {
    console.log('artistSlice: ', state);
    console.log('artistSlice: ', state.artists);
    return state.artists.topArtists;
}