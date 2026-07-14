# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Music Historeum is a Billboard-chart history browser: a React front end and an Express/PostgreSQL back end, split into two independently-run npm projects.

- `client/` — Create React App (react-scripts 5) + Redux Toolkit
- `server/` — Express API that wraps a PostgreSQL database (`node-pg`)
- `bb_script/` — standalone Python data-ingestion script that populates the same Postgres database the server reads from (see below)
- `Other_Files/` — archival design assets, screenshots, an old server snapshot, and a ~110MB `0BillboardData.pgsql` dump. Not part of the build; treat as reference only.

## Commands

Run each from its respective directory (`client/` or `server/`); there is no root-level package.json tying them together.

```bash
# client
cd client
npm start        # dev server at http://localhost:3000
npm test         # CRA/Jest interactive watch mode (react-scripts test)
npm run build    # production build to client/build

# server
cd server
node index.js    # starts the API (reads server/.env, listens on API_PORT)
```

There is no configured server test script (`npm test` in `server/` just exits with an error) and no lint script in either project.

### Server environment

`server/index.js` requires a `server/.env` (gitignored) with:
- `PG_USER`, `PG_PASSWORD`, `PG_HOST`, `PG_PORT`, `PG_DATABASE` — connection info for a local PostgreSQL instance holding the Billboard chart data (`db.js`)
- `MAIL_USER`, `MAIL_PASSWORD` — SMTP creds for the contact form's nodemailer transport (`mail.musichistoreum.com`)
- `API_PORT` — port the Express app listens on

The server logs via `winston` to `server/mh_server.log` (file transport only, no console transport).

### Client API base URL

`client/src/services/baseUrl.js` hardcodes `http://localhost:5000/` with the production URL commented out above it. Toggle this by hand when pointing the client at a different backend — it is not read from an env var.

### Python ingestion script (`bb_script/bb_scrape.py`)

A separate, standalone Python script (`billboard`/`billboard.py`, `psycopg2`) that scrapes Billboard chart data and populates the same PostgreSQL database the Express server reads from — it's the data producer for `chart_list`, `chart_dates`, `artist_list`, `song_list`, `album_list`, and `chart_entries`. It is not invoked by the server or client; it's run manually/out-of-band. Main loop (bottom of the file): for each active chart in `chart_list`, walk forward via `chart.nextDate` from wherever that chart last left off, look up-or-insert artist/song/album rows, insert chart entries (catching Postgres unique-violation `23505` as an expected duplicate-skip rather than a real error), and sleep 10s between requests to avoid hammering Billboard. Logs to `bb_script/billboard.log`.

**Security note:** `bb_scrape.py` currently has the Postgres password hardcoded inline in the `psycopg2.connect(...)` call, and (unlike `server/.env`) this file is not gitignored. Move that credential to an environment variable before committing this script.

## Architecture

### Server: thin router over SQL functions

`server/index.js` is a single-file Express app. Almost all business logic (chart aggregation, artist lookups, date-range rollups) lives in PostgreSQL functions, not JS — routes just call them and return rows:
- `GET /chartList` — charts flagged `online=true` in `chart_list`
- `GET /artist/list/:start_char` — calls SQL `get_artist_list(...)`
- `GET /artist/:dartist/:dtype` — calls `get_songs_by_artist` or `get_albums_by_artist` depending on `:dtype`
- `GET /chart/:cid/:ctype/:ctf/:cdate` — dispatches by `:ctype` (`Song`/`Album`) and `:ctf` (`Week`/`Month`/`Year`/`Decade`) to `get_weekly_{type}_chart` or `get_range_{type}_chart`, computing the end-of-range date with `dayjs` for Month/Year/Decade
- `POST /contact` — sends the contact form via nodemailer

Adding a new chart timeframe or query means adding/matching a corresponding SQL function in the database, not just editing this file.

### Client: feature-sliced Redux Toolkit app

- `src/features/<domain>/` — one Redux slice + its UI per domain (`chart`, `chartMenu`, `artist`, `contact`, `counter`). Slices are combined in `src/app/store.js`.
- `src/pages/` — route-level containers (`HomePage`, `ChartPage`, `ArtistPage`, `FeaturesPage`, `AboutPage`, `KnownIssues`), wired up in `src/App.js`'s `<Routes>`.
- `src/services/` — thin `fetch` wrappers (one per endpoint) that call `baseUrl` and unwrap the SQL function's result key (e.g. `fetchChartData` reads `data[0].get_weekly_song_chart` or `data[0].get_range_song_chart` depending on timeframe — the response shape mirrors the Postgres function name that produced it).
- `src/components/` — shared, non-feature-specific UI (`Header`, `Footer`, `AlphabetNav`, `Table`).
- `src/app/shared/` — static column definitions (`*_COLUMNS.js`) and lookup data (`TOP_ARTISTS`, `SONG_CHARTS`, `ALBUM_CHARTS`) consumed by the table/chart components.

**Startup data flow:** `App.js` fetches `/chartList` on mount and dispatches `updateLastDate` into the `chartsMenu` slice for every chart before rendering any `<Route>` (gated on a local `dataLoaded` flag). Anything that needs "last available chart date" per chart depends on this having completed first.

**Chart selection flow:** `chartsSlice` holds both `currentChart` (what's rendered) and `pendingChart` (what the menu UI is building up via `updatePendingId`/`Type`/`Timeframe`/`Date`). `updateCurrentChart` commits pending → current and flips `chartStatus.updateChart`, which is what actually triggers `ChartCard` to re-fetch via `fetchChartData`.

**Table rendering:** `components/Table.js` wraps `react-table` (v7, hooks-based: `useTable`/`useFilters`/`useGlobalFilter`/`usePagination`) with fuzzy filtering (`match-sorter`) and custom pagination controls. Clicking a cell in the `artist_name` column navigates to `/Artist/:artist` (see `checkCellValue`) — this is the site's main cross-linking mechanism between charts and artist pages, not an explicit link/button.

**Chart page reload state:** `ChartPage`/`ArtistPage`/`KnownIssues` all check `sessionStorage.getItem('reloadPage')` on mount; `ChartCard`'s `window.onbeforeunload` stashes the current chart selection into `sessionStorage` before a reload so the chart picker can restore state after a hard refresh.

### Known in-progress issues (see `pages/KnownIssues.js` and recent commit history)

- Artist search is currently plain text matching, not ID-based — collaborations aren't properly associated across multiple artists yet.
- Pre-1962 charts have adjusted start dates as a workaround, which affects the weekly/monthly datepickers; the valid chart day-of-week (Saturday vs. Monday) for pre-1962 charts is still unresolved.
- Mobile layout is an ongoing effort (several recent commits target mobile styling specifically).
