import { baseUrl } from "./baseUrl";

async function fetchChartList() {
    const response = await fetch(`${baseUrl}chartList`);
    const data = await response.json();
        return data;
}

export default fetchChartList;