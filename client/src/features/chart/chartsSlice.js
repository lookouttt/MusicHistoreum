import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    currentChart: {
        chartId: 1,
        chartType: "Song",
        chartTimeframe: "Week",
        chartDate: "1989-11-25"
    },
    pendingChart: {
        chartId: 1,
        chartType: "Song",
        chartTimeframe: "Week",
        chartDate: "1989-11-25"
    }  
};

const chartsSlice = createSlice({
    name: 'charts',
    initialState,
    reducers: {
        updatePendingId: (state, action) => {
            const newChart = {
                ...state.pendingChart,
                chartId: action.chartId
            };
            state.pendingChart = newChart;
        },
        updatePendingType: (state, action) => {
            const newChart = {
                ...state.pendingChart,
                chartId: action.chartType
            };
            state.pendingChart = newChart;
        },
        updatePendingTimeframe: (state, action) => {
            const newChart = {
                ...state.pendingChart,
                chartId: action.chartTimeframe
            };
            state.pendingChart = newChart;
        },
        updatePendingDate: (state, action) => {
            const newChart = {
                ...state.pendingChart,
                chartId: action.chartDate
            };
            state.pendingChart = newChart;
        },
        updateCurrentChart: (state) => {
            state.currentChart = state.pendingChart;
        }
    }
});

export const chartsReducer = chartsSlice.reducer;

export const { updatePendingId, updatePendingType, updatePendingTimeframe, updatePendingDate, updateCurrentChart } = chartsSlice.actions;

export const selectCurrentChart = (state) => {
    return state.charts.currentChart;
}