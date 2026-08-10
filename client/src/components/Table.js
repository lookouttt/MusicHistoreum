import React, { useEffect, useState } from "react";
import { useFilters, useGlobalFilter, useTable } from "react-table";
import { useNavigate } from 'react-router-dom';
import {matchSorter} from 'match-sorter';

// Define a default UI for filtering
function DefaultColumnFilter({
  column: { filterValue, preFilteredRows, setFilter },
}) {
  const count = preFilteredRows.length

  return (
    <input
      value={filterValue || ''}
      onChange={e => {
        setFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
      }}
      placeholder={`Search ${count} records...`}
      style={{
        fontSize: '0.9rem',
        border: '0',
        maxWidth: '125px',
      }}
    />
  )
}

function fuzzyTextFilterFn(rows, id, filterValue) {
  return matchSorter(rows, filterValue, { keys: [row => row.values[id]] })
}

// Let the table remove the filter if the string is empty
fuzzyTextFilterFn.autoRemove = val => !val

export default function Table({
                            columns,
                            data,
                            hiddenColumns = [],
                            onCloseModal,
                            maxRows,
                            bFilter,
                            selectable = false,
                            selectedIds,
                            onToggleRow }) {
    const [prevHiddenColumns, setPrevHiddenColumns] = useState([]);

    const filterTypes = React.useMemo(
    () => ({
      // Add a new fuzzyTextFilterFn filter type.
      fuzzyText: fuzzyTextFilterFn,
      // Or, override the default text filter to use
      // "startWith"
      text: (rows, id, filterValue) => {
        return rows.filter(row => {
          const rowValue = row.values[id]
          return rowValue !== undefined
            ? String(rowValue)
                .toLowerCase()
                .startsWith(String(filterValue).toLowerCase())
            : true
        })
      },
    }),
    []
  )

  const defaultColumn = React.useMemo(
    () =>  ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter,
    }),
    []
  )
  // Use the useTable Hook to send the columns and data to build the table
  const {
    getTableProps, // table props from react-table
    getTableBodyProps, // table body props from react-table
    headerGroups, // headerGroups, if your table has groupings
    rows, // rows for the table based on the data passed (post-filter, unpaginated)
    prepareRow, // Prepare the row (this function needs to be called for each row before getting the row props)
    setHiddenColumns,
  } = useTable({
        columns,
        data,
        defaultColumn,
        filterTypes,
    },
    useFilters,
    useGlobalFilter
  );

  const displayRows = typeof maxRows === 'number' ? rows.slice(0, maxRows) : rows;

  useEffect(() => {
    // const prevHiddenColumns = () => [];
    if (JSON.stringify(prevHiddenColumns) !== JSON.stringify(hiddenColumns)) {
      setPrevHiddenColumns(hiddenColumns);
      setHiddenColumns(hiddenColumns);
    }
}, [hiddenColumns, prevHiddenColumns, setHiddenColumns, setPrevHiddenColumns]);
   
    const navigate = useNavigate();
    const checkCellValue = (cell) =>{
        if (cell.column.id === 'artist_name') {
            const currentArtist = cell.value;
            if (onCloseModal)
                onCloseModal();
            navigate(`/Artist/${encodeURIComponent(currentArtist)}`);
        }
    }

  /*
    Render the UI for your table
    - react-table doesn't have UI, it's headless. We just need to put the react-table props from the Hooks, and it will do its magic automatically
  */
  return (
    <div style={{ overflowX: 'auto' }}>
        <table {...getTableProps()}>
        <thead>
            {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
                {selectable && <th></th>}
                {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render("Header")}
                    <div>{(column.canFilter && bFilter) ? column.render('Filter') : null}</div>
                </th>
                ))}
            </tr>
            ))}
        </thead>
        <tbody {...getTableBodyProps()}>
            {displayRows.map((row, i) => {
            prepareRow(row);
            return (
                <tr {...row.getRowProps()}>
                {selectable && (
                    <td>
                        <input
                            type="checkbox"
                            checked={selectedIds.has(String(row.original.song_id))}
                            onChange={() => onToggleRow(row.original.song_id)}
                        />
                    </td>
                )}
                {row.cells.map(cell => {
                    if (cell.column.id !== 'artist_name') {
                        return <td {...cell.getCellProps()}>{cell.render("Cell")}</td>;
                    }
                    return (
                        <td
                            {...cell.getCellProps()}
                            className="artist-link-cell"
                            role="button"
                            tabIndex={0}
                            style={{ cursor: 'pointer' }}
                            onClick={() => checkCellValue(cell)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    checkCellValue(cell);
                                }
                            }}
                        >
                            {cell.render("Cell")}
                        </td>
                    );
                })}
                </tr>
            );
            })}
        </tbody>
        </table>
    </div>
  );
}