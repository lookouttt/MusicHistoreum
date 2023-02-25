import React, { useEffect, useState } from "react";
import { useFilters, useGlobalFilter, usePagination, useTable, useAsyncDebounce } from "react-table";
import { useNavigate } from 'react-router-dom';
import {matchSorter} from 'match-sorter';

// Define a default UI for filtering
function GlobalFilter({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
}) {
  const count = preGlobalFilteredRows.length
  const [value, setValue] = React.useState(globalFilter)
  const onChange = useAsyncDebounce(value => {
    setGlobalFilter(value || undefined)
  }, 200)

  return (
    <span>
      Search:{' '}
      <input
        value={value || ""}
        onChange={e => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={`${count} records...`}
        style={{
          fontSize: '1.1rem',
          border: '0',
        }}
      />
    </span>
  )
}

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
                            tablePageSize, 
                            bPage, 
                            bFilter }) {
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
    // rows, // rows for the table based on the data passed
    prepareRow, // Prepare the row (this function needs to be called for each row before getting the row props)
    setHiddenColumns,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
    preGlobalFilteredRows,
    setGlobalFilter,
  } = useTable({
        columns,
        data,
        initialState: { pageIndex: 0, pageSize: tablePageSize},
        defaultColumn,
        filterTypes,
    },
    useFilters,
    useGlobalFilter,
    usePagination
  );

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
            console.log('This is the artist cell');
            console.log(cell.value);
            const currentArtist = cell.value;
            if (onCloseModal)
                onCloseModal();
            navigate(`/Artist/${currentArtist}`);
        }
    }

    const TablePagination = () => {
            return (
      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>{' '}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>{' '}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>{' '}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>{' '}
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{' '}
        </span>
        <span>
          | Go to page:{' '}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              gotoPage(page)
            }}
            style={{ width: '100px' }}
          />
        </span>{' '}
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
        )
    }
  /* 
    Render the UI for your table
    - react-table doesn't have UI, it's headless. We just need to put the react-table props from the Hooks, and it will do its magic automatically
  */
  return (
    <>
        <table {...getTableProps()}>
        <thead>
            {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render("Header")}
                    <div>{(column.canFilter && bFilter) ? column.render('Filter') : null}</div>
                </th>
                ))}
            </tr>
            ))}
        </thead>
        <tbody {...getTableBodyProps()}>
            {page.map((row, i) => {
            prepareRow(row);
            return (
                <tr {...row.getRowProps()}>
                {row.cells.map(cell => {
                    //  console.log("I'm putting a row in the table");
                    return <td onClick={() => checkCellValue(cell)} {...cell.getCellProps()}>{cell.render("Cell")}</td>;
                })}
                </tr>
            );
            })}
        </tbody>
        </table>
        { (bPage) && <TablePagination /> }
    </>
  );
}