import { baseUrl } from "./baseUrl";

async function fetchChartList() {
    const response = await fetch(`${baseUrl}chartList`);
    if (!response.ok) {
        throw new Error(`Failed to fetch chart list: ${response.status}`);
    }
    const data = await response.json();
    return data;
}

export default fetchChartList;