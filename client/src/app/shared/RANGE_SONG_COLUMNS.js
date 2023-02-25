const RANGE_SONG_COLUMNS = [
    {
        Header: 'Rank',
        accessor: 'song_rank',
        disableFilters: true,
    },
    {
        Header: 'ID',
        accessor: 'song_id',
        disableFilters: true,
    },
    {
        Header: 'Song',
        accessor: 'song_title',
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

export default RANGE_SONG_COLUMNS;