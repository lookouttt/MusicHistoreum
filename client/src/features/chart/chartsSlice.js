import { createSlice } from '@reduxjs/toolkit';
//import { CHART_INIT_VALS } from '../../app/shared/CHART_INIT_VALS';

const initialState = {
    currentChart:     {
        chartId: 1,
        chartType: "Song",
        chartTimeframe: "Week",
        chartDate: "1989-11-25"
    }  
};

const chartsSlice = createSlice({
    name: 'charts',
    initialState
});

export const chartsReducer = chartsSlice.reducer;

export const selectCurrentChart = (state) => {
    return state.charts.currentChart;
}