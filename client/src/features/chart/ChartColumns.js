import WeekSongColumns from '../../app/shared/WEEK_SONG_COLUMNS';
import WeekAlbumColumns from '../../app/shared/WEEK_ALBUM_COLUMNS';
import RangeSongColumns from '../../app/shared/RANGE_SONG_COLUMNS';
import RangeAlbumColumns from '../../app/shared/RANGE_ALBUM_COLUMNS';

const ChartColumns = (chart) => {
    const { chartType, chartTimeframe } = chart;
    if (chartType === 'Song') {
        switch (chartTimeframe) {
            case 'Week':
                return WeekSongColumns;
            default:
                return RangeSongColumns;
        }
    } else {
        switch (chartTimeframe) {
            case 'Week':
                return WeekAlbumColumns;
            default:
                return RangeAlbumColumns;
        }
    }
};

export default ChartColumns;