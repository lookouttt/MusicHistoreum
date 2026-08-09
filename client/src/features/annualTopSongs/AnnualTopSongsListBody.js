import { List } from 'react-window';
import { useInfiniteLoader } from 'react-window-infinite-loader';
import AnnualTopSongsRow from './AnnualTopSongsRow';

// must match AnnualTopSongsList.css: .annualTopSongsRow__appearanceLine height (22px) + its
// flex gap (2px) = 24px per additional line. Any mismatch here compounds across every row in
// the virtualized list (react-window sums all prior row heights to place each row), so drift
// that looks tiny per-row turns into visible overlap a few hundred rows down.
const BASE_ROW_HEIGHT = 40;   // one appearance line + row padding/border
const EXTRA_LINE_HEIGHT = 24; // each additional appearance line (22px) + gap (2px)

function AnnualTopSongsListBody({ rows, totalCount, selectedIds, onToggleRow, loadMoreRows }) {
    const rowCount = totalCount !== null ? totalCount : Object.keys(rows).length + 1;

    const onRowsRendered = useInfiniteLoader({
        isRowLoaded: (index) => rows[index] !== undefined,
        loadMoreRows: (startIndex, stopIndex) => loadMoreRows(startIndex, stopIndex),
        rowCount,
    });

    const getRowHeight = (index, cellProps) => {
        const row = cellProps.rows[index];
        const appearanceCount = row ? row.appearances.length : 1;
        return BASE_ROW_HEIGHT + (appearanceCount - 1) * EXTRA_LINE_HEIGHT;
    };

    return (
        <List
            rowComponent={AnnualTopSongsRow}
            rowCount={rowCount}
            rowHeight={getRowHeight}
            rowProps={{ rows, selectedIds, onToggleRow }}
            onRowsRendered={onRowsRendered}
            style={{ height: '70vh' }}
            className='annualTopSongsListBody'
        />
    );
}

export default AnnualTopSongsListBody;
