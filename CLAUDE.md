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
- `PG_USER`, `PG_PASSWORD`, `PG_HOST`, `PG_PORT`, `PG_DATABASE` — connection info for the PostgreSQL database holding the Billboard chart data (`db.js`). The DB has been migrated to a hosted Aiven Postgres instance (see `bb_script/` below); set `PG_SSL=true` to have `db.js` connect with `ssl: { rejectUnauthorized: false }` for that case.
- `MAIL_USER`, `MAIL_PASSWORD` — SMTP creds for the contact form's nodemailer transport (`mail.musichistoreum.com`)
- `API_PORT` — port the Express app listens on (only used when running via `node index.js`; not needed on Vercel, see Deployment below)
- `CORS_ORIGIN` — optional comma-separated list of allowed CORS origins; defaults to `http://localhost:3000` if unset
- `LOG_LEVEL` — optional winston log level; defaults to `info`
- `APPLE_TEAM_ID`, `APPLE_KEY_ID` — Apple Developer/MusicKit identifiers used to sign Apple Music developer tokens
- `APPLE_PRIVATE_KEY_PATH` — path (relative to `server/`) to the `.p8` MusicKit private key file, e.g. `./keys/AuthKey_<KEY_ID>.p8`. The `server/keys/` directory is gitignored — never commit the `.p8` file.
- `APPLE_PRIVATE_KEY` — alternative to `APPLE_PRIVATE_KEY_PATH`: the key's PEM contents directly (with `\n` for newlines), used on serverless platforms like Vercel where there's no local file to read. If neither Apple env var is set, the developer-token route just responds 503 rather than failing startup.

The server logs via `winston` to both `server/mh_server.log` (JSON file transport) and the console (colorized simple format).

### Client API base URL

`client/src/services/baseUrl.js` reads `process.env.REACT_APP_API_BASE_URL`, falling back to `http://localhost:5000/` if unset. Set `REACT_APP_API_BASE_URL` (a CRA env var, so it must be defined at build time) to point the client at a different backend.

### Python ingestion script (`bb_script/bb_scrape.py`)

A separate, standalone Python script (`billboard`/`billboard.py`, `psycopg2`) that scrapes Billboard chart data and populates the same PostgreSQL database the Express server reads from — it's the data producer for `chart_list`, `chart_dates`, `artist_list`, `song_list`, `album_list`, and `chart_entries`. It is not invoked by the server or client; it's run manually/out-of-band. Main loop (bottom of the file): for each active chart in `chart_list`, walk forward via `chart.nextDate` from wherever that chart last left off, look up-or-insert artist/song/album rows, insert chart entries (catching Postgres unique-violation `23505` as an expected duplicate-skip rather than a real error), and sleep 10s between requests to avoid hammering Billboard. Logs to `bb_script/billboard.log`.

**Security note:** `bb_scrape.py` currently has the Postgres password hardcoded inline in the `psycopg2.connect(...)` call (`DB_CONN_STRING`), and (unlike `server/.env`) this file is not gitignored. Move that credential to an environment variable before committing this script.

`bb_script/` also has one-off migration tooling used for the Aiven DB migration (`migrate_chart_entries.py`, `sync_to_aiven.py`) — these are not part of the ongoing scrape loop and are run manually as needed; `bb_script/.env` (gitignored) holds their DB credentials.

## Deployment

The server is prepped for Vercel serverless deployment alongside its original standalone-Node mode:
- `server/vercel.json` rewrites all requests to `/api/index`.
- `server/api/index.js` just `require`s `server/index.js` and hands Vercel the exported Express `app`.
- `server/index.js` only calls `app.listen(...)` when run directly (`require.main === module`), so requiring it from `api/index.js` skips binding a port and lets Vercel's Node runtime treat the app as a `(req, res)` handler.
- On Vercel, use `APPLE_PRIVATE_KEY` (inline PEM) instead of `APPLE_PRIVATE_KEY_PATH`, and set `PG_SSL=true` to reach the hosted Aiven database over SSL.

The production site is live at `https://www.musichistoreum.com` (client), with the bare apex `musichistoreum.com` set to permanently redirect to `www` via Vercel's domain settings. DNS for `musichistoreum.com` is registered/hosted at hosting.com (not on Vercel's nameservers) — the `www` CNAME and apex `A` record point at Vercel individually, chosen specifically so the domain's existing mail DNS (`mail.musichistoreum.com`, backing `MAIL_USER`/`MAIL_PASSWORD`) isn't disturbed. Production `CORS_ORIGIN` and `REACT_APP_API_BASE_URL` are set to match this domain.

## Architecture

### Server: thin router over SQL functions

`server/index.js` is a single-file Express app. Almost all business logic (chart aggregation, artist lookups, date-range rollups) lives in PostgreSQL functions, not JS — routes just call them and return rows:
- `GET /chartList` — charts flagged `online=true` in `chart_list`
- `GET /artist/list/:start_char` — calls SQL `get_artist_list(...)`
- `GET /artist/:dartist/:dtype` — calls `get_songs_by_artist` or `get_albums_by_artist` depending on `:dtype`
- `GET /chart/:cid/:ctype/:ctf/:cdate` — dispatches by `:ctype` (`Song`/`Album`) and `:ctf` (`Week`/`Month`/`Year`/`Decade`) to `get_weekly_{type}_chart` or `get_range_{type}_chart`, computing the end-of-range date with `dayjs` for Month/Year/Decade
- `POST /contact` — validates/sanitizes the payload (`validateContactPayload`, `escapeHtml`) and sends the contact form via nodemailer
- `GET /apple-music/developer-token` — signs and returns a MusicKit JS developer token (`jsonwebtoken`, ES256, keyed by `APPLE_TEAM_ID`/`APPLE_KEY_ID`/private key), cached in-memory and re-signed once it's within a day of its ~6-month expiry; responds 503 if Apple env vars aren't configured

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

**Apple Music playlist export (`src/features/appleMusicPlaylist/`):** lets a user turn a selection of chart rows into an Apple Music library playlist. `ChartCard` renders `AppleMusicPlaylistToolbar` only for the main chart page's Song charts (`bIncludeNav && chartType === 'Song'`) — album charts and the embedded/secondary chart views don't get it. Flow: `musicKitLoader` lazy-loads the MusicKit JS SDK from Apple's CDN → `musicKitAuth` fetches a developer token via `fetchAppleMusicDeveloperToken` (calling the server's `/apple-music/developer-token`) and prompts the user to authorize their Apple Music account → `CreatePlaylistModal` collects a playlist name and calls `createAppleMusicPlaylist`, which uses `songMatcher` to fuzzy-match each Billboard song/artist against Apple's catalog search (normalizing text and splitting out the primary artist from "Featuring"/"&"/etc. credits, since Billboard's `artist_name` often lists collaborators that Apple's catalog doesn't) before creating the playlist and batching tracks into it via the MusicKit API.

### Planned features (see `pages/FeaturesPage.js`)

The "Future Features" page lists roadmap items not yet built: chart search/filtering enhancements, richer song/album/artist metadata, user login with custom saved charts, playlist/streaming-service integration, a chart-history blog, and looking up a song's BPM via [GetSongBPM.com](https://getsongbpm.com).

### Known in-progress issues (see `pages/KnownIssues.js` and recent commit history)

- Artist search is currently plain text matching, not ID-based — collaborations aren't properly associated across multiple artists yet.
- Pre-1962 charts have adjusted start dates as a workaround, which affects the weekly/monthly datepickers; the valid chart day-of-week (Saturday vs. Monday) for pre-1962 charts is still unresolved.
- Mobile layout is an ongoing effort (several recent commits target mobile styling specifically).
