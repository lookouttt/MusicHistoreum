import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardBody, CardHeader } from 'reactstrap';
import fetchAnnualTopSongs from '../../services/fetchAnnualTopSongs';
import { ANNUAL_TOP_SONGS_CHARTS } from '../../app/shared/ANNUAL_TOP_SONGS_CHARTS';
import AppleMusicPlaylistToolbar from '../appleMusicPlaylist/AppleMusicPlaylistToolbar';
import AnnualTopSongsListBody from './AnnualTopSongsListBody';
import './AnnualTopSongsList.css';

const PAGE_SIZE = 50;

const SORT_FIELD_OPTIONS = [
    { value: 'chart', label: 'Chart' },
    { value: 'artist', label: 'Artist' },
    { value: 'rank', label: 'Year + Rank' },
    { value: 'title', label: 'Song Title' },
];

function AnnualTopSongsList() {
    const [selectedCharts, setSelectedCharts] = useState(
        ANNUAL_TOP_SONGS_CHARTS.map((chart) => chart.ChartName)
    );
    const [yearFrom, setYearFrom] = useState('');
    const [yearTo, setYearTo] = useState('');
    const [primarySort, setPrimarySort] = useState('rank');
    const [primaryDir, setPrimaryDir] = useState('asc');
    const [secondarySort, setSecondarySort] = useState('');
    const [secondaryDir, setSecondaryDir] = useState('asc');

    // Rows are stored keyed by their absolute position (not appended sequentially), so jumping
    // straight to e.g. row 15,000 doesn't require first fetching every page before it -- only
    // the range actually requested gets fetched. `rows` is a plain object ({0: row, 1: row, ...}),
    // which supports the exact same bracket-index access (`rows[i]`) as an array everywhere else
    // in this feature (AnnualTopSongsRow.js, AnnualTopSongsListBody.js's row-height calc), so
    // only the fetching/storage logic here needs to change.
    const [rows, setRows] = useState({});
    const [totalCount, setTotalCount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [selectingAll, setSelectingAll] = useState(false);

    const rowsRef = useRef({});
    const totalCountRef = useRef(null);
    const pendingRangesRef = useRef(new Set());

    const sortParam = secondarySort
        ? `${primarySort}:${primaryDir},${secondarySort}:${secondaryDir}`
        : `${primarySort}:${primaryDir}`;

    useEffect(() => {
        let cancelled = false;
        rowsRef.current = {};
        totalCountRef.current = null;
        pendingRangesRef.current = new Set();
        setRows({});
        setTotalCount(null);
        setSelectedIds(new Set());
        setFetchError(false);
        setLoading(true);

        fetchAnnualTopSongs({ charts: selectedCharts, yearFrom, yearTo, sort: sortParam, limit: PAGE_SIZE, offset: 0 })
            .then(({ rows: newRows, totalCount: tc }) => {
                if (cancelled) return;
                const byIndex = {};
                newRows.forEach((row, i) => { byIndex[i] = row; });
                rowsRef.current = byIndex;
                totalCountRef.current = tc;
                setRows(byIndex);
                setTotalCount(tc);
            })
            .catch(() => { if (!cancelled) setFetchError(true); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCharts, yearFrom, yearTo, sortParam]);

    // Fetches exactly the [startIndex, stopIndex] range the virtualized list actually asked
    // for -- e.g. after jumping straight to the bottom of the list, this fetches that one
    // range directly instead of walking sequentially through everything before it.
    const loadMoreRows = async (startIndex, stopIndex) => {
        if (totalCountRef.current !== null && startIndex >= totalCountRef.current) return;
        const rangeKey = `${startIndex}-${stopIndex}`;
        if (pendingRangesRef.current.has(rangeKey)) return;
        pendingRangesRef.current.add(rangeKey);
        try {
            const limit = Math.min(Math.max(stopIndex - startIndex + 1, PAGE_SIZE), 200);
            const { rows: newRows, totalCount: tc } = await fetchAnnualTopSongs({
                charts: selectedCharts, yearFrom, yearTo, sort: sortParam,
                limit, offset: startIndex,
            });
            newRows.forEach((row, i) => { rowsRef.current[startIndex + i] = row; });
            if (totalCountRef.current === null) totalCountRef.current = tc;
            setRows({ ...rowsRef.current });
            setTotalCount(totalCountRef.current);
        } catch (err) {
            setFetchError(true);
        } finally {
            pendingRangesRef.current.delete(rangeKey);
        }
    };

    const toggleRow = (songId) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            const id = String(songId);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Selects every song matching the current chart/year filter, not just what's been
    // scrolled into view. Fetches the full matching set in one request (limit=all) and, since
    // it's the same filter/sort as the paginated view, also adopts it as the loaded row set --
    // so the playlist toolbar has real row data for every selected song, and further scrolling
    // needs no more network requests for this filter/sort combination.
    const selectAll = async () => {
        setSelectingAll(true);
        try {
            const { rows: allRows, totalCount: tc } = await fetchAnnualTopSongs({
                charts: selectedCharts, yearFrom, yearTo, sort: sortParam, limit: 'all',
            });
            const byIndex = {};
            allRows.forEach((row, i) => { byIndex[i] = row; });
            rowsRef.current = byIndex;
            totalCountRef.current = tc;
            setRows(byIndex);
            setTotalCount(tc);
            setSelectedIds(new Set(allRows.map((row) => String(row.song_id))));
        } catch (err) {
            setFetchError(true);
        } finally {
            setSelectingAll(false);
        }
    };

    const clearSelection = () => setSelectedIds(new Set());

    const toggleChart = (chartName) => {
        setSelectedCharts((prev) =>
            prev.includes(chartName) ? prev.filter((c) => c !== chartName) : [...prev, chartName]
        );
    };

    const secondarySortOptions = SORT_FIELD_OPTIONS.filter((opt) => opt.value !== primarySort);
    const loadedRows = useMemo(() => Object.values(rows), [rows]);

    if (fetchError) {
        return (
            <Card className='annualTopSongsCard'>
                <CardBody>
                    <p>Sorry, the annual top songs list couldn't be loaded. Please try again later.</p>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card className='annualTopSongsCard'>
            <CardHeader>
                <h2>Top Songs by Year</h2>
            </CardHeader>
            <CardBody>
                <div className='annualTopSongsControls'>
                    <div className='annualTopSongsControls__group'>
                        <span className='annualTopSongsControls__label'>Charts:</span>
                        {ANNUAL_TOP_SONGS_CHARTS.map((chart) => (
                            <label key={chart.ChartName} className='annualTopSongsControls__checkbox'>
                                <input
                                    type='checkbox'
                                    checked={selectedCharts.includes(chart.ChartName)}
                                    onChange={() => toggleChart(chart.ChartName)}
                                />
                                {chart.ChartTitle}
                            </label>
                        ))}
                    </div>
                    <div className='annualTopSongsControls__group'>
                        <span className='annualTopSongsControls__label'>Years:</span>
                        <input
                            type='number'
                            placeholder='From'
                            value={yearFrom}
                            onChange={(e) => setYearFrom(e.target.value)}
                            className='form-control form-control-sm annualTopSongsControls__yearInput'
                        />
                        <span>&ndash;</span>
                        <input
                            type='number'
                            placeholder='To'
                            value={yearTo}
                            onChange={(e) => setYearTo(e.target.value)}
                            className='form-control form-control-sm annualTopSongsControls__yearInput'
                        />
                    </div>
                    <div className='annualTopSongsControls__group'>
                        <span className='annualTopSongsControls__label'>Sort by:</span>
                        <select
                            value={primarySort}
                            onChange={(e) => setPrimarySort(e.target.value)}
                            className='form-select form-select-sm'
                        >
                            {SORT_FIELD_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <select
                            value={primaryDir}
                            onChange={(e) => setPrimaryDir(e.target.value)}
                            className='form-select form-select-sm'
                        >
                            <option value='asc'>Ascending</option>
                            <option value='desc'>Descending</option>
                        </select>
                        <span>then by:</span>
                        <select
                            value={secondarySort}
                            onChange={(e) => setSecondarySort(e.target.value)}
                            className='form-select form-select-sm'
                        >
                            <option value=''>None</option>
                            {secondarySortOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {secondarySort && (
                            <select
                                value={secondaryDir}
                                onChange={(e) => setSecondaryDir(e.target.value)}
                                className='form-select form-select-sm'
                            >
                                <option value='asc'>Ascending</option>
                                <option value='desc'>Descending</option>
                            </select>
                        )}
                    </div>
                </div>

                <p className='annualTopSongsControls__count'>
                    {totalCount !== null ? totalCount.toLocaleString() : '…'} song{totalCount === 1 ? '' : 's'} in this list
                </p>

                <AppleMusicPlaylistToolbar
                    data={loadedRows}
                    selectedIds={selectedIds}
                    onClear={clearSelection}
                    defaultPlaylistName='Top Songs by Year'
                    showTopNPresets={false}
                    onSelectAll={selectAll}
                    selectAllLoading={selectingAll}
                />

                {loading && loadedRows.length === 0 ? (
                    <p>Loading&hellip;</p>
                ) : (
                    <>
                    <div className='annualTopSongsListHeader'>
                        <span />
                        <span>Song</span>
                        <span>Artist</span>
                        <span>Charted On</span>
                    </div>
                    <AnnualTopSongsListBody
                        rows={rows}
                        totalCount={totalCount}
                        selectedIds={selectedIds}
                        onToggleRow={toggleRow}
                        loadMoreRows={loadMoreRows}
                    />
                    </>
                )}
            </CardBody>
        </Card>
    );
}

export default AnnualTopSongsList;
