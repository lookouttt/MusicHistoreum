import { createSlice, current } from '@reduxjs/toolkit';

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
    },
    chartStatus: {
        updateChart: false  
    }
};

const chartsSlice = createSlice({
    name: 'charts',
    initialState,
    reducers: {
        updatePendingId: (state, action) => {
            const newChart = {
                ...state.pendingChart,
                chartId: action.payload
            };
            state.pendingChart = newChart;
            console.log('pending ID: ', state.pendingChart);
        },
        updatePendingType: (state, action) => {
            let chartType;
            if (action.payload == 1)
                chartType = 'Song';
            else
                chartType = 'Album';

            const newChart = {
                ...state.pendingChart,
                chartType: chartType
            };
            state.pendingChart = newChart;
            console.log('pending type: ', state.pendingChart);
        },
        updatePendingTimeframe: (state, action) => {
            let chartTimeframe;
            if (action.payload == 1)
                chartTimeframe = 'Week';
            else if (action.payload == 2)
                chartTimeframe = 'Month';
            else if (action.payload == 3)
                chartTimeframe = 'Year';
            else
                chartTimeframe = 'Decade';
            const newChart = {
                ...state.pendingChart,
                chartTimeframe: chartTimeframe
            };
            state.pendingChart = newChart;
            console.log('pending timeframe: ', state.pendingChart);
        },
        updatePendingDate: (state, action) => {
            const newChart = {
                ...state.pendingChart,
                chartDate: action.payload
            };
            state.pendingChart = newChart;
            console.log('pending date: ', state.pendingChart);
        },
        updateCurrentChart: (state) => {
            console.log('current before: ', current(state.currentChart));
            state.currentChart = state.pendingChart;
            console.log('current after: ', current(state.currentChart));
            const newStatus = {
                updateChart: true
            };
            state.chartStatus = newStatus;
            console.log('UCC reset state: ', state.chartStatus);
        },
        updateChartStatus: (state) => {
            const newStatus = {
                updateChart: false
            };
            state.chartStatus = newStatus;
            console.log('UCS reset state: ', state.chartStatus);
        }
    }
});



export const chartsReducer = chartsSlice.reducer;

export const { updatePendingId, updatePendingType, updatePendingTimeframe, updatePendingDate, updateCurrentChart, updateChartStatus } = chartsSlice.actions;

export const selectCurrentChart = (state) => {
    return state.charts.currentChart;
}

export const getUpdateChartState = (state) => {
    return state.charts.chartStatus.updateChart;
}