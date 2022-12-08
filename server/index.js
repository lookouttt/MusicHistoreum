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

//get a specific chart for a given range

app.get("/chart/:cid/:ctype/:ctf/:cdate", async(req, res) => {
//app.get("/chart", async(req, res) => {
    try {
        const chartId = req.params.cid;
        const chartType = req.params.ctype;
        const chartTime = req.params.ctf;
        const chartDate = req.params.cdate;
        const startDate = dayjs(chartDate);
        console.log(req.params);
        if (chartType === 'Song') {
            if (chartTime === 'Week') {
                const chart = await pool.query("SELECT get_weekly_song_chart($1, $2)", [chartId, chartDate]);
                res.json(chart.rows);
            }
            else if (chartTime === 'Month') {
                const endDate = dayjs(startDate).endOf('month');
                const chart = await pool.query("SELECT get_range_song_chart($1, $2, $3)", [chartId, startDate, endDate]);
                res.json(chart.rows);
            }
            else if (chartTime === 'Year') {
                const endDate = dayjs(startDate).endOf('year');
                const chart = await pool.query("SELECT get_range_song_chart($1, $2, $3)", [chartId, startDate, endDate]);
                res.json(chart.rows);
            }
            else if (chartTime === 'Decade') {
                const endOfYear = dayjs(startDate).endOf('year');
                const endDate = dayjs(endOfYear).add(9,'year');
                const chart = await pool.query("SELECT get_range_song_chart($1, $2, $3)", [chartId, startDate, endDate]);
                res.json(chart.rows);
            }
            else {
                res.status(422).send("Invalid chart timeframe.  Chart timeframe must be Week, Month, Year, or Decade.");
            }
        }
        else if (chartType === 'Album') {
            if (chartTime === 'Week') {
                const chart = await pool.query("SELECT get_weekly_album_chart($1, $2)", [chartId, chartDate]);
                res.json(chart.rows);
            }
            else if (chartTime === 'Month') {
                const endDate = dayjs(startDate).endOf('month');
                const chart = await pool.query("SELECT get_range_album_chart($1, $2, $3)", [chartId, startDate, endDate]);
                res.json(chart.rows);
            }
            else if (chartTime === 'Year') {
                const endDate = dayjs(startDate).endOf('year');
                const chart = await pool.query("SELECT get_range_album_chart($1, $2, $3)", [chartId, startDate, endDate]);
                res.json(chart.rows);
            }
            else if (chartTime === 'Decade') {
                const endOfYear = dayjs(startDate).endOf('year');
                const endDate = dayjs(endOfYear).add(9,'year');
                const chart = await pool.query("SELECT get_range_album_chart($1, $2, $3)", [chartId, startDate, endDate]);
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

//create a todo
/*
app.post("/todos", async(req, res) => {
    try {
        const { description } = req.body;
        const newTodo = await pool.query("INSERT INTO todo (description) VALUES($1) RETURNING *", [description]);
        res.json(newTodo.rows[0]);
    } catch (err) {
        console.error(err.message);
    }
});

//get all todos

app.get("/todos", async(req, res) => {
    try {
        const allTodos = await pool.query("SELECT * FROM todo");
        res.json(allTodos.rows);
    } catch (err) {
        console.error(err.message);
    }
});

//get a todo

app.get("/todos/:id", async(req, res) => {
    try {
        const { id } = req.params;
        const todo = await pool.query("SELECT * FROM todo WHERE todo_id = $1", [id]);
        res.json(todo.rows[0]);
    } catch (err) {
        console.error(err.message);
    }
})

//update a todo

app.put("/todos/:id", async(req, res) => {
    try {
        const { id } = req.params;
        const { description } = req.body;
        const updateTodo = await pool.query("UPDATE todo SET description = $1 WHERE todo_id = $2",[description, id]);
        res.json("Todo was updated!");
    } catch (err) {
        console.error(err.message);
    }
});

//delete a todo
app.delete("/todos/:id", async(req, res) => {
    try {
        const { id } = req.params;
        const deleteTodo = await pool.query("DELETE FROM todo WHERE todo_id = $1", [id]);
        res.json("Todo was deleted!");
    } catch (err) {
        console.error(err.message);
    }
})
*/
app.listen(5000, () => {
    console.log("server has started on port 5000");
});