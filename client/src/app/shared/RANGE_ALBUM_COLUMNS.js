const RANGE_ALBUM_COLUMNS = [
    {
        Header: 'Rank',
        accessor: 'album_rank',
        disableFilters: true,
    },
    {
        Header: 'ID',
        accessor: 'album_id',
        disableFilters: true,
    },
    {
        Header: 'Album',
        accessor: 'album_title',
    },
    {
        Header: 'Artist',
        accessor: 'artist_name',
    },
    {
        Header: 'Peak',
        accessor: 'peak',
        disableFilters: true,
    },
    {
        Header: 'First Week',
        accessor: 'first_date',
        disableFilters: true,
    },
    {
        Header: 'Last Week',
        accessor: 'last_date',
        disableFilters: true,
    },
    {
        Header: 'Points',
        accessor: 'points',
        disableFilters: true,
    },
    {
        Header: 'Weeks On Chart',
        accessor: 'weeks',
        disableFilters: true,
    },
];

export default RANGE_ALBUM_COLUMNS;