require('dotenv').config();
const express = require("express");
const router = express.Router();
const cors = require("cors");
const nodemailer = require("nodemailer");
const winston = require("winston");
const { combine, timestamp, json } = winston.format;

const app = express();
const pool = require("./db");
const dayjs = require("dayjs");

const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000'];

//middleware
app.use(cors({ origin: corsOrigins }));
app.use(express.json()); //req.body
app.use("/", router);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp(), json()),
    transports: [
        new winston.transports.File({
            filename: 'mh_server.log',
        }),
        new winston.transports.Console({
            format: combine(winston.format.colorize(), winston.format.simple()),
        }),
    ],
});

const contactEmail = nodemailer.createTransport({
    host: 'mail.musichistoreum.com',
    port: 465,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
    },
});

contactEmail.verify((error) => {
    if (error) {
        logger.error(error);
    } else {
        logger.info("Ready to Send Email");
    }
});

const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
}[c]));

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
const CONTACT_TOPICS = ['Default', 'Chart Question', 'Feature Request', 'Other'];

const validateContactPayload = ({ firstName, lastName, email, text, topic }) => {
    const errors = [];
    if (!firstName || firstName.length < 2 || firstName.length > 30) {
        errors.push('First name must be between 2 and 30 characters.');
    }
    if (!lastName || lastName.length < 2 || lastName.length > 40) {
        errors.push('Last name must be between 2 and 40 characters.');
    }
    if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
        errors.push('A valid email address is required.');
    }
    if (!text || text.length < 1 || text.length > 5000) {
        errors.push('Comment text must be between 1 and 5000 characters.');
    }
    if (!CONTACT_TOPICS.includes(topic)) {
        errors.push('Invalid topic.');
    }
    return errors;
};

//ROUTES//

//get list of available charts

app.get("/testConnect", (req, res) => {
    res.json('This is a test response');
});



app.get("/chartList", async(req, res) => {
    try {
        const allCharts = await pool.query("SELECT * FROM chart_list where online=true");
        res.json(allCharts.rows);
    } catch (err) {
       logger.error(err.message);
       res.status(500).json({ error: "Failed to retrieve chart list." });
    }
});

app.get("/artist/list/:start_char", async(req, res) => {
    try {
        const startChar = req.params.start_char;
        logger.info('trying to get artist list: ', startChar);
        const allArtists = await pool.query(`SELECT get_artist_list($1)`, [startChar]);
        logger.info('post artist list check');
        res.json(allArtists.rows);
    } catch (err) {
        logger.info('got error trying to get artist list');
        logger.error(err.message);
        res.status(500).json({ error: "Failed to retrieve artist list." });
    }
});

//get artist chart history

app.get("/artist/:dartist/:dtype", async(req, res) => {
    try {
        const artistName = req.params.dartist;
        const queryType = req.params.dtype;
        logger.info(req.params);
        let artist;
        if (queryType === 'songs')
            artist = await pool.query(`SELECT get_songs_by_artist($1)`, [artistName]);
        else
            artist = await pool.query(`SELECT get_albums_by_artist($1)`, [artistName]);
        res.json(artist.rows);
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ error: "Failed to retrieve artist data." });
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
        logger.info(req.params);
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
        logger.error(err.message);
        res.status(500).json({ error: "Failed to retrieve chart data." });
    }
});


router.post("/contact", (req, res) => {
    logger.info(req.body)

    const validationErrors = validateContactPayload(req.body);
    if (validationErrors.length > 0) {
        return res.status(422).json({ status: "ERROR", errors: validationErrors });
    }

    const { firstName, lastName, email, text, topic } = req.body;
    const name = `${firstName} ${lastName}`;
    const mail = {
        from: name,
        to: process.env.MAIL_USER,
        subject: `Music Historeum Contact Form Submission - ${topic}`,
        html: `<p>Name: ${escapeHtml(name)}</p>
                <p>Email: ${escapeHtml(email)}</p>
                <p>Message: ${escapeHtml(text)}</p>`,
    };
    contactEmail.sendMail(mail, (error) => {
        if (error) {
        logger.error("Status: ERROR", error);
        res.status(500).json({ status: "ERROR" });
        } else {
        logger.info("Status: Message Sent");
        res.json({ status: "Message Sent" });
        }
    });
});

let server = app.listen(process.env.API_PORT, () => {
    logger.info("server has started on musichistoreum.com with port ", server.address().port);
    logger.info("Test: ", server.address())
});

process.on('exit', () => {
    logger.info("server is stopping");
})