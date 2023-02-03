require('dotenv').config();
const express = require("express");
const router = express.Router();
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const pool = require("./db");
const dayjs = require("dayjs");

//middleware
app.use(cors());
app.use(express.json()); //req.body
app.use("/", router);

const contactEmail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
    },
});

contactEmail.verify((error) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Ready to Send Email");
    }
});

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

app.get("/artist/list/:start_char", async(req, res) => {
    try {
        const startChar = req.params.start_char;
        console.log('trying to get artist list: ', startChar);
        const allArtists = await pool.query(`SELECT get_artist_list(${startChar})`);
        console.log('post artist list check');
        res.json(allArtists.rows);
    } catch (err) {
        console.log('got error trying to get artist list');
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


router.post("/contact", (req, res) => {
    console.log(req.body)
    const name = req.body.firstName + " " + req.body.lastName;
    const email = req.body.email;
    const message = req.body.text; 
    const mail = {
        from: name,
        to: process.env.MAIL_USER,
        subject: "Music Historeum Contact Form Submission",
        html: `<p>Name: ${name}</p>
                <p>Email: ${email}</p>
                <p>Message: ${message}</p>`,
    };
    contactEmail.sendMail(mail, (error) => {
        if (error) {
        console.log("Status: ERROR");
        res.json({ status: "ERROR" });
        } else {
        console.log("Status: Message Sent");
        res.json({ status: "Message Sent" });
        }
    });
});

app.listen(5000, () => {
    console.log("server has started on port 5000");
});