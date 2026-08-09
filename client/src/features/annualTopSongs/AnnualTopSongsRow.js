import { useNavigate } from 'react-router-dom';
import { ANNUAL_TOP_SONGS_CHARTS } from '../../app/shared/ANNUAL_TOP_SONGS_CHARTS';

const CHART_TITLES = ANNUAL_TOP_SONGS_CHARTS.reduce((acc, chart) => {
    acc[chart.ChartName] = chart.ChartTitle;
    return acc;
}, {});

function AnnualTopSongsRow({ index, style, rows, selectedIds, onToggleRow }) {
    const navigate = useNavigate();
    const row = rows[index];

    const goToArtist = () => navigate(`/Artist/${encodeURIComponent(row.artist_name)}`);

    if (!row) {
        return (
            <div style={style} className='annualTopSongsRow annualTopSongsRow--loading'>
                Loading&hellip;
            </div>
        );
    }

    return (
        <div style={style} className='annualTopSongsRow'>
            <span className='annualTopSongsRow__select'>
                <input
                    type='checkbox'
                    checked={selectedIds.has(String(row.song_id))}
                    onChange={() => onToggleRow(row.song_id)}
                />
            </span>
            <span className='annualTopSongsRow__title'>{row.song_title}</span>
            <span
                className='annualTopSongsRow__artist'
                role='button'
                tabIndex={0}
                onClick={goToArtist}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        goToArtist();
                    }
                }}
            >
                {row.artist_name}
            </span>
            <span className='annualTopSongsRow__appearances'>
                {row.appearances.map((a) => (
                    <span key={`${a.chart_id}-${a.year}`} className='annualTopSongsRow__appearanceLine'>
                        <span className='annualTopSongsRow__appearanceChart'>
                            {CHART_TITLES[a.chart_name] || a.chart_name}
                        </span>
                        <span className='annualTopSongsRow__appearanceYear'>
                            {a.year}
                            {!a.is_year_complete && (
                                <sup title='This year is still in progress on this chart -- rankings may still change.'> *</sup>
                            )}
                        </span>
                        <span className='annualTopSongsRow__appearanceRank'>#{a.year_rank}</span>
                    </span>
                ))}
            </span>
        </div>
    );
}

export default AnnualTopSongsRow;
