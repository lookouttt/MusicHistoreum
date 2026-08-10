require('dotenv').config();
const express = require("express");
const router = express.Router();
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const winston = require("winston");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { combine, timestamp, json, splat } = winston.format;

const app = express();
const pool = require("./db");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000'];

//middleware

// Required for express-rate-limit to see the real client IP (rather than Vercel's
// edge/proxy address) when this app runs behind Vercel's serverless platform.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: corsOrigins }));
app.use(express.json()); //req.body
app.use("/", router);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(splat(), timestamp(), json()),
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
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
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

let appleMusicPrivateKey = null;
if (process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID) {
    try {
        if (process.env.APPLE_PRIVATE_KEY) {
            // Preferred for serverless deployments (e.g. Vercel), where there's no
            // local file to read - the key's PEM content is stored directly.
            appleMusicPrivateKey = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');
        } else if (process.env.APPLE_PRIVATE_KEY_PATH) {
            appleMusicPrivateKey = fs.readFileSync(path.resolve(__dirname, process.env.APPLE_PRIVATE_KEY_PATH), 'utf8');
        }
        if (appleMusicPrivateKey) {
            logger.info("Apple Music private key loaded, developer token route enabled");
        } else {
            logger.info("Apple Music env vars not configured, developer token route disabled");
        }
    } catch (error) {
        logger.error(`Failed to load Apple Music private key: ${error.message}`);
    }
} else {
    logger.info("Apple Music env vars not configured, developer token route disabled");
}

const APPLE_MUSIC_TOKEN_TTL_SECONDS = 15777000; // ~6 months, Apple's documented max
let appleMusicDeveloperToken = null;
let appleMusicDeveloperTokenExpiresAt = 0;

const getAppleMusicDeveloperToken = () => {
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (appleMusicDeveloperToken && Date.now() < appleMusicDeveloperTokenExpiresAt - oneDayMs) {
        return appleMusicDeveloperToken;
    }
    appleMusicDeveloperToken = jwt.sign({}, appleMusicPrivateKey, {
        algorithm: 'ES256',
        issuer: process.env.APPLE_TEAM_ID,
        keyid: process.env.APPLE_KEY_ID,
        expiresIn: APPLE_MUSIC_TOKEN_TTL_SECONDS,
    });
    appleMusicDeveloperTokenExpiresAt = Date.now() + APPLE_MUSIC_TOKEN_TTL_SECONDS * 1000;
    return appleMusicDeveloperToken;
};

// The public web client can't hide a secret (it's a plain browser fetch, readable in the
// bundle/Network tab), so a shared-secret header can't restrict it. What it *can* do is
// throttle scripted scraping of this credential-backed route. APPLE_MUSIC_CLIENT_SECRET is
// optional and unset by default; it exists for a future native (e.g. iOS) caller, which can
// keep a secret with real (if not perfect) effectiveness and so gets to skip the public limit.
const isTrustedAppleMusicClient = (req) =>
    Boolean(process.env.APPLE_MUSIC_CLIENT_SECRET) &&
    req.get('X-MH-Client-Secret') === process.env.APPLE_MUSIC_CLIENT_SECRET;

const appleMusicDeveloperTokenLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: isTrustedAppleMusicClient,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for /apple-music/developer-token from ${req.ip}`);
        res.status(429).json({ error: "Too many requests. Please try again later." });
    },
});

// Shared limiter for the public, unauthenticated DB-backed read routes (chart list, artist
// lookups, chart data, annual top songs) - generous enough not to bother a real browsing
// session, just a ceiling against unbounded scripted scraping.
const publicReadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for ${req.path} from ${req.ip}`);
        res.status(429).json({ error: "Too many requests. Please try again later." });
    },
});

// A real visitor submits this form at most once or twice; there's no legitimate caller that
// needs more than a handful of submissions per hour, so this is stricter than the dev-token
// limiter above and has no shared-secret bypass.
const contactFormLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for /contact from ${req.ip}`);
        res.status(429).json({ status: "ERROR", errors: ["Too many requests. Please try again later."] });
    },
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



app.get("/chartList", publicReadLimiter, async(req, res) => {
    try {
        const allCharts = await pool.query("SELECT * FROM chart_list where online=true");
        res.json(allCharts.rows);
    } catch (err) {
       logger.error(err.message);
       res.status(500).json({ error: "Failed to retrieve chart list." });
    }
});

app.get("/artist/list/:start_char", publicReadLimiter, async(req, res) => {
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

app.get("/artist/:dartist/:dtype", publicReadLimiter, async(req, res) => {
    try {
        const artistName = req.params.dartist;
        const queryType = req.params.dtype;
        if (queryType !== 'songs' && queryType !== 'albums') {
            return res.status(422).json({ error: "Invalid artist data type. Must be 'songs' or 'albums'." });
        }
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

const WEEKLY_CHART_FUNCTIONS = { Song: 'get_weekly_song_chart', Album: 'get_weekly_album_chart' };
const RANGE_CHART_FUNCTIONS = { Song: 'get_range_song_chart', Album: 'get_range_album_chart' };

app.get("/chart/:cid/:ctype/:ctf/:cdate", publicReadLimiter, async(req, res) => {
    try {
        const chartId = req.params.cid;
        const chartType = req.params.ctype;
        const chartTime = req.params.ctf;
        const chartDate = req.params.cdate;

        if (!dayjs(chartDate, 'YYYY-MM-DD', true).isValid()) {
            return res.status(422).json({ error: "Invalid chart date. Date must be in YYYY-MM-DD format." });
        }
        const startDate = dayjs(chartDate);
        logger.info(req.params);
        if (chartType === 'Song' || chartType === 'Album') {
            const weeklyFn = WEEKLY_CHART_FUNCTIONS[chartType];
            const rangeFn = RANGE_CHART_FUNCTIONS[chartType];
            if (chartTime === 'Week') {
                const chart = await pool.query(`SELECT ${weeklyFn}($1, $2)`, [chartId, chartDate]);
                res.json(chart.rows);
            }
            else if (chartTime === 'Month') {
                const endDate = dayjs(startDate).endOf('month');
                const chart = await pool.query(`SELECT ${rangeFn}($1, $2, $3)`, [chartId, startDate, endDate]);
                res.json(chart.rows);
            }
            else if (chartTime === 'Year') {
                const endDate = dayjs(startDate).endOf('year');
                const chart = await pool.query(`SELECT ${rangeFn}($1, $2, $3)`, [chartId, startDate, endDate]);
                res.json(chart.rows);
            }
            else if (chartTime === 'Decade') {
                const endOfYear = dayjs(startDate).endOf('year');
                const endDate = dayjs(endOfYear).add(9,'year');
                const chart = await pool.query(`SELECT ${rangeFn}($1, $2, $3)`, [chartId, startDate, endDate]);
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

//get the top songs of each year across a fixed set of charts (annual_top_songs table)

const ANNUAL_TOP_SONGS_CHARTS = {
    'hot-100': 1,
    'country-songs': 45,
    'adult-contemporary': 43,
    'alternative-airplay': 60,
    'hot-mainstream-rock-tracks': 67,
};

// each sort key maps to one or more actual columns, applied together as a unit in the requested direction
// (chart/rank use the "best-ever" columns derived per song by the grouped query below)
const ANNUAL_TOP_SONGS_SORT_COLUMNS = {
    chart: ['best_chart_name'],
    artist: ['artist_name', 'song_title'],
    rank: ['best_rank'],
    title: ['song_title', 'artist_name'],
};

app.get("/annual-top-songs", publicReadLimiter, async (req, res) => {
    try {
        const requestedCharts = req.query.chart
            ? String(req.query.chart).split(',').filter((c) => c in ANNUAL_TOP_SONGS_CHARTS)
            : Object.keys(ANNUAL_TOP_SONGS_CHARTS);
        if (requestedCharts.length === 0) {
            return res.status(422).json({ error: "Invalid chart filter." });
        }
        const chartIds = requestedCharts.map((c) => ANNUAL_TOP_SONGS_CHARTS[c]);

        const seen = new Set();
        const sortLevels = String(req.query.sort || 'rank:asc')
            .split(',')
            .map((part) => {
                const [field, dir] = part.split(':');
                return { field, dir: dir === 'desc' ? 'DESC' : 'ASC' };
            })
            .filter(({ field }) => ANNUAL_TOP_SONGS_SORT_COLUMNS[field] && !seen.has(field) && seen.add(field));
        if (sortLevels.length === 0) {
            sortLevels.push({ field: 'rank', dir: 'ASC' });
        }
        const orderClause = sortLevels
            .flatMap(({ field, dir }) => ANNUAL_TOP_SONGS_SORT_COLUMNS[field].map((col) => `${col} ${dir}`))
            .join(', ');

        // "all" bypasses LIMIT/OFFSET entirely -- used by "Select All" on the client, which
        // needs every matching song_id (not just a page of them) to populate a selection.
        // annual_top_songs is a bounded, materialized table (~16-21k rows total across all
        // charts), so returning everything matching a filter in one response is fine.
        const fetchAll = req.query.limit === 'all';
        const limit = fetchAll ? null : Math.min(parseInt(req.query.limit, 10) || 50, 200);
        const offset = fetchAll ? 0 : (parseInt(req.query.offset, 10) || 0);

        const params = [chartIds];
        let where = 'WHERE chart_id = ANY($1)';
        if (req.query.yearFrom) {
            params.push(parseInt(req.query.yearFrom, 10));
            where += ` AND year >= $${params.length}`;
        }
        if (req.query.yearTo) {
            params.push(parseInt(req.query.yearTo, 10));
            where += ` AND year <= $${params.length}`;
        }
        let limitClause = '';
        if (!fetchAll) {
            params.push(limit, offset);
            limitClause = `LIMIT $${params.length - 1} OFFSET $${params.length}`;
        }

        const sql = `WITH matching_appearances AS (
                         SELECT * FROM annual_top_songs ${where}
                     ),
                     grouped AS (
                         SELECT
                             song_id, song_title, artist_id, artist_name,
                             json_agg(json_build_object(
                                 'chart_id', chart_id, 'chart_name', chart_name,
                                 'year', year, 'year_rank', year_rank, 'is_year_complete', is_year_complete
                             ) ORDER BY year_rank ASC, year DESC) AS appearances,
                             MIN(year_rank) AS best_rank,
                             (array_agg(chart_name ORDER BY year_rank ASC))[1] AS best_chart_name,
                             bool_and(is_year_complete) AS all_complete
                         FROM matching_appearances
                         GROUP BY song_id, song_title, artist_id, artist_name
                     )
                     SELECT *, COUNT(*) OVER() AS total_count
                     FROM grouped
                     ORDER BY ${orderClause}
                     ${limitClause}`;

        const result = await pool.query(sql, params);
        const totalCount = result.rows[0]?.total_count ? parseInt(result.rows[0].total_count, 10) : 0;
        res.json({ rows: result.rows, totalCount, limit, offset });
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ error: "Failed to retrieve annual top songs." });
    }
});

//get a signed Apple Music developer token (MusicKit JS uses this to authorize the end user client-side)

app.get("/apple-music/developer-token", appleMusicDeveloperTokenLimiter, (req, res) => {
    if (!appleMusicPrivateKey) {
        return res.status(503).json({ error: "Apple Music integration is not configured." });
    }
    try {
        const token = getAppleMusicDeveloperToken();
        res.json({ token });
    } catch (err) {
        logger.error(err.message);
        res.status(500).json({ error: "Failed to generate Apple Music developer token." });
    }
});


router.post("/contact", contactFormLimiter, (req, res) => {
    const validationErrors = validateContactPayload(req.body);
    if (validationErrors.length > 0) {
        return res.status(422).json({ status: "ERROR", errors: validationErrors });
    }

    const { firstName, lastName, email, text, topic } = req.body;
    const name = `${firstName} ${lastName}`;
    const mail = {
        // Gmail's SMTP relay requires the From address to match the authenticated account
        // (or a verified alias) - a bare display name with no address, which the old A2
        // Hosting transport tolerated, gets rejected here.
        from: `"${name}" <${process.env.MAIL_USER}>`,
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

// Only bind to a port when run directly (e.g. `node index.js` / `npm start`).
// Serverless entry points (e.g. api/index.js for Vercel) just require the
// exported app instead, since the platform handles listening itself.
if (require.main === module) {
    let server = app.listen(process.env.API_PORT, () => {
        logger.info("server has started on musichistoreum.com with port ", server.address().port);
        logger.info("Test: ", server.address())
    });

    process.on('exit', () => {
        logger.info("server is stopping");
    });
}

module.exports = app;