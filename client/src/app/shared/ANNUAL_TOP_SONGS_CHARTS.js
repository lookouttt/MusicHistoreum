import { SONG_CHARTS } from './SONG_CHARTS';

const TARGET_CHART_NAMES = [
    'hot-100',
    'country-songs',
    'adult-contemporary',
    'alternative-airplay',
    'hot-mainstream-rock-tracks',
];

export const ANNUAL_TOP_SONGS_CHARTS = SONG_CHARTS.filter(
    (chart) => TARGET_CHART_NAMES.includes(chart.ChartName)
);
