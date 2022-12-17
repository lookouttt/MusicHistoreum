const getTestResponse = () => {
    fetch("http://localhost:5000/chart/1/Song/Week/1989-11-11")
    .then((response) => response.json())
    .then((actualData) => console.log(actualData))
    .catch((err) => {
        console.log(err.message);
    });
}

export default getTestResponse;