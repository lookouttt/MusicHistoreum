const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
const dayjs = require("dayjs");

//middleware
app.use(cors());
app.use(express.json()); //req.body

//ROUTES//

//get list of available charts

app.get("/chartList", async(req, res) => {
    try {
        const allCharts = await pool.query("SELECT * FROM chart_list");
        res.json(allCharts.rows);
    } catch (err) {
        console.error(err.message);
    }
});

//get artist chart history

app.get("/artist/:dartist/:dtype", async(req, res) => {
    try {
        const artistName = req.params.dartist;
        const queryType = req.params.dtype;
        console.log(req.params);
        let artist;
        if (queryType === 'songs')
            artist = await pool.query(`SELECT get_songs_by_artist($1)`, [artistName]);
        else
            artist = await pool.query(`SELECT get_albums_by_artist($1)`, [artistName]);
        res.json(artist.rows);
    } catch (err) {
        console.error(err.message);
    }
});

//get a specific chart for a given range

app.get("/chart/:cid/:ctype/:ctf/:cdate", async(req, res) => {
    try {
        const chartId = req.params.cid;
        const chartType = req.params.ctype;
        const chartTime = req.params.ctf;
        const chartDate = req.params.cdate;
        const startDate = dayjs(chartDate);
        console.log(req.params);
        if (chartType === 'Song' || chartType === 'Album') {
            if (chartTime === 'Week') {
                const chart = await pool.query(`SELECT get_weekly_${chartType}_chart($1, $2)`, [chartId, chartDate]);
                res.json(chart.rows);
            }
            else if (chartTime === 'Month') {
                const endDate = dayjs(startDate).endOf('month');
                const chart = await pool.query(`SELECT get_range_${chartType}_chart($1, $2, $3)`, [chartId, startDate, endDate]);
                res.json(chart.rows);
            }
            else if (chartTime === 'Year') {
                const endDate = dayjs(startDate).endOf('year');
                const chart = await pool.query(`SELECT get_range_${chartType}_chart($1, $2, $3)`, [chartId, startDate, endDate]);
                res.json(chart.rows);
            }
            else if (chartTime === 'Decade') {
                const endOfYear = dayjs(startDate).endOf('year');
                const endDate = dayjs(endOfYear).add(9,'year');
                const chart = await pool.query(`SELECT get_range_${chartType}_chart($1, $2, $3)`, [chartId, startDate, endDate]);
                res.json(chart.rows);
            }
            else {
                res.status(422).send("Invalid chart timeframe.  Chart timeframe must be Week, Month, Year, or Decade.");
            }
        }
        else {
            res.status(422).send("Invalid chart type.  Chart type must be Song or Album.");
        }

    } catch (err) {
        console.error(err.message);
    }
});

app.listen(5000, () => {
    console.log("server has started on port 5000");
});