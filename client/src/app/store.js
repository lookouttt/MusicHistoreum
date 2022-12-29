import { configureStore } from '@reduxjs/toolkit';
import { chartsReducer } from '../features/chart/chartsSlice';
import { songChartsReducer } from '../features/chartMenu/songChartMenusSlice';
import { albumChartsReducer } from '../features/chartMenu/albumChartMenusSlice';

export const store = configureStore({
  reducer: {
    charts: chartsReducer,
    songCharts: songChartsReducer,
    albumCharts: albumChartsReducer
  }
});
