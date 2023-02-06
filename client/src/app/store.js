import { configureStore } from '@reduxjs/toolkit';
import { chartsReducer } from '../features/chart/chartsSlice';
import { chartsMenuReducer } from '../features/chartMenu/chartsMenusSlice';
import { artistsReducer } from '../features/artist/artistsSlice';

export const store = configureStore({
  reducer: {
    charts: chartsReducer,
    chartsMenu: chartsMenuReducer,
    artists: artistsReducer
  }
});
