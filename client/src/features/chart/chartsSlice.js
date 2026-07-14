import { createSlice } from '@reduxjs/toolkit';

const CHART_TYPE_BY_ID = {
    '1': 'Song',
    '2': 'Album'
};

const CHART_TIMEFRAME_BY_ID = {
    '1': 'Week',
    '2': 'Month',
    '3': 'Year',
    '4': 'Decade'
};

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
        },
        updatePendingType: (state, action) => {
            const chartType = CHART_TYPE_BY_ID[action.payload];
            if (!chartType) {
                console.warn('updatePendingType: unrecognized chart type id', action.payload);
                return;
            }
            state.pendingChart = {
                ...state.pendingChart,
                chartType: chartType
            };
        },
        updatePendingTimeframe: (state, action) => {
            const chartTimeframe = CHART_TIMEFRAME_BY_ID[action.payload];
            if (!chartTimeframe) {
                console.warn('updatePendingTimeframe: unrecognized timeframe id', action.payload);
                return;
            }
            state.pendingChart = {
                ...state.pendingChart,
                chartTimeframe: chartTimeframe
            };
        },
        updatePendingDate: (state, action) => {
            const newChart = {
                ...state.pendingChart,
                chartDate: action.payload
            };
            state.pendingChart = newChart;
        },
        updateCurrentChart: (state) => {
            state.currentChart = state.pendingChart;
            const newStatus = {
                updateChart: true
            };
            state.chartStatus = newStatus;
        },
        updateChartStatus: (state) => {
            const newStatus = {
                updateChart: false
            };
            state.chartStatus = newStatus;
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