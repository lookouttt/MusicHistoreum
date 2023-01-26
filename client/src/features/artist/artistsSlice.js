import { createSlice, current } from '@reduxjs/toolkit';

const initialState = {
    artistStatus: {
        updateArtist: false  
    }
};

const artistsSlice = createSlice({
    name: 'artists',
    initialState,
    reducers: {
        updateCurrentArtist: (state) => {
            const newStatus = {
                updateArtist: true
            };
            state.artistStatus = newStatus;
            console.log('UCA reset state: ', state.artistStatus);
        },
        updateArtistStatus: (state) => {
            const newStatus = {
                updateArtist: false
            };
            state.artistStatus = newStatus;
            console.log('UAS reset state: ', state.artistStatus);
        }
    }
});



export const artistsReducer = artistsSlice.reducer;

export const { updateCurrentArtist, updateArtistStatus } = artistsSlice.actions;

export const getUpdateArtistState = (state) => {
    return state.artists.artistStatus.updateArtist;
}