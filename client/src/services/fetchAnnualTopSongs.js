import { baseUrl } from "./baseUrl";

async function fetchAnnualTopSongs({ charts, yearFrom, yearTo, sort, limit, offset }) {
    const params = new URLSearchParams();
    if (charts && charts.length) params.set('chart', charts.join(','));
    if (yearFrom) params.set('yearFrom', yearFrom);
    if (yearTo) params.set('yearTo', yearTo);
    if (sort) params.set('sort', sort);
    if (limit) params.set('limit', limit);
    if (offset) params.set('offset', offset);

    const response = await fetch(`${baseUrl}annual-top-songs?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch annual top songs: ${response.status}`);
    }
    const data = await response.json();
    return { rows: data.rows, totalCount: data.totalCount };
}

export default fetchAnnualTopSongs;
