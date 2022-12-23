import { configureStore } from '@reduxjs/toolkit';
import { chartsReducer } from '../features/chart/chartsSlice';

export const store = configureStore({
  reducer: {
    charts: chartsReducer,
  },
});
