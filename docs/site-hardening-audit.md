# Site Hardening & Security Audit

Consolidates the original repository audit backlog (`docs/remaining-audit-items.md`, now
retired) with a full follow-up pass across the server, client, Python ingestion, and database
layers (2026-08-09). Organized by area, then by priority (High/Medium/Low) within each area.

## Server (`server/index.js`, `db.js`)

### Done this pass
- D1. `/apple-music/developer-token` had no auth or rate limiting despite being backed by a
  real Apple-private-key-signed credential — fixed with per-IP rate limiting, an optional
  shared-secret bypass for the future native app, and `trust proxy` so IP-based limiting
  works correctly behind Vercel.

### High
- S1. `POST /contact` has no rate limiting — a script can loop it to spam outbound mail
  through `mail.musichistoreum.com`, risking that domain's deliverability/blacklist status.

### Medium
- S2. No rate limiting on any other public DB-backed read route (`/chartList`,
  `/artist/list/:start_char`, `/artist/:dartist/:dtype`, `/chart/:cid/:ctype/:ctf/:cdate`,
  `/annual-top-songs`) — fully open, no cost ceiling.
- S3. `db.js`'s `pg` Pool sets no `statement_timeout`/`query_timeout` — a slow/pathological
  query can hold a connection indefinitely; combined with S2, a few concurrent expensive
  requests could exhaust the pool.
- S4. *(carried forward)* `/contact` logs the raw payload (`logger.info(req.body)`) —
  name/email/message persisted in plaintext to `mh_server.log` indefinitely, no redaction.
- S5. No baseline security headers (`helmet()` or equivalent).

### Low
- S6. *(carried forward)* `get_weekly_${chartType}_chart`/`get_range_${chartType}_chart`
  build the function name by string interpolation of `chartType`; safe today only because of
  the earlier `Song`/`Album` guard — should become an explicit allow-list lookup.
- S7. *(carried forward)* Winston's `logger.info('label', value)` multi-arg calls likely
  silently drop the second argument — the format chain has no `splat()`.
- S8. *(carried forward)* Root `.gitignore` only ignores the literal `server/mh_server.log`,
  not a `*.log` wildcard.
- S9. `/artist/:dartist/:dtype` silently treats any `dtype` other than exactly `'songs'` as an
  albums request instead of validating/rejecting unrecognized values.
- S10. `/chart/.../:cdate` doesn't validate `cdate` parses to a real date before hitting
  `dayjs`/Postgres — malformed input surfaces as a generic 500 instead of a 422.

## Client (`client/src/**`)

### Medium
- C1. `songMatcher.js` fires one Apple Music catalog search per selected song (concurrency 5,
  no caching/dedup by title+artist) — a large "Select All" playlist export can generate
  thousands of individual Apple API calls instead of batching/deduping.
- C2. `ChartCard.js` assigns `window.onbeforeunload` directly in the render body (not inside
  `useEffect`) — re-registers a new closure every render and can clobber other handlers.
- C3. `ChartCard.js`/`ArtistCard.js` fetch effects have no cancellation guard
  (`AbortController`/cancelled-flag) — rapid chart/artist navigation can let a stale response
  overwrite state after a newer request already resolved. (`AnnualTopSongsList.js` already
  does this correctly — good pattern to copy elsewhere.)
- C4. Several images in `client/src/app/assets/img/` are unoptimized JPEGs (2-3MB each, one
  apparently an unused legacy banner) — inflates page weight materially if not compressed.

### Low
- C5. *(carried forward, expanded)* Three overlapping styling systems (bootstrap + reactstrap
  + styled-components) plus an unmaintained `font-awesome@4.7.0` (2017) layered on top for
  icons — architectural overlap worth a deliberate look.
- C6. `client/.env.production`/`.env.development` are committed (not gitignored) — currently
  only a public API base URL, not a live leak, but normalizes committing `.env*` files.
- C7. `CreatePlaylistModal.js` surfaces raw `err.message` from MusicKit/Apple failures
  directly to the user — low risk (Apple's own SDK text, not backend internals) but unvetted.
- C8. `TopArtistList.js` puts the `key` prop on the inner `<Link>` instead of the `<li>`
  returned by `.map()` — React still warns about missing keys.
- C9. Stray `console.warn` left in `songMatcher.js`/`chartsSlice.js` for match/dispatch
  failures — not sensitive, just console noise in production.
- C10. `ArtistCard.js`'s "no songs/albums found" branches call `setSongItems`/`setAlbumItems`
  with a zero-arg function instead of the array directly — works today only because React's
  functional-updater form happens to invoke it and use the return value; fragile/confusing,
  worth simplifying to a plain array. (Verified this does *not* currently break rendering,
  contrary to the initial research pass's read of it.)
- C11. *(carried forward)* `SONG_CHARTS.js` — true historical `FirstDate` values for pre-1962
  charts left commented out rather than removed.

## Python ingestion (`bb_script/`)

### High
- P1. *(carried forward, expanded)* Hardcoded plaintext Postgres password in `bb_scrape.py`'s
  `DB_CONN_STRING` — the file is git-tracked (not ignored), so the credential is committed to
  history; the same password is also duplicated in `bb_script/.env`. Move to an env var and
  rotate the credential, since it's already been committed.
- P2. `bb_scrape.py`'s per-item insert loop (`getArtistId`/`insertSong`/`insertAlbum`/
  `insertChartEntry`) has no exception handling — only the chart-date fetch is wrapped, so a
  DB error mid-chart (e.g. a dropped connection) crashes the whole scrape run uncaught.

### Medium
- P3. 13 of 15 `conn.cursor()` calls in `bb_scrape.py` are never closed (no
  `with`/context managers anywhere) — cursor-leak risk in a long-running loop processing
  millions of rows.

### Low
- P4. *(carried forward)* `time.sleep(10)` repeated 3x as an unnamed magic number.
- P5. *(carried forward)* No docstrings/type hints; redundant `print(...)` +
  `logging...(...)` pairs throughout instead of relying on the logger alone.
- P6. `sync_to_aiven.py`/`migrate_chart_entries.py`/`annual_top_songs.py` interpolate
  table/column names into SQL via f-strings rather than parameterizing — safe today since
  values only come from hardcoded dicts, but a latent injection-shaped pattern if a table
  name ever becomes configurable.
- P7. `weekly_update.bat` (untracked) hardcodes absolute local paths including the Windows
  username; appends to `logs\weekly_update.log` indefinitely with no rotation.
- P8. `sync_to_aiven.py`'s `load_env` doesn't strip quotes from values, unlike
  `annual_top_songs.py`'s near-duplicate implementation — inconsistent parsing between the two.
- P9. `bb_scrape.py`'s `retrieveChartIds` opens `billboard.txt` and a cursor with no
  `finally`/close-on-error handling — leaks the file handle if `billboard.charts()` or the DB
  insert raises.

## Database (`db/functions/*.sql`, `db/tables/*.sql`)

### High
- B1. `chart_dates` has a PK only on `chart_date_id`; no index on `chart_id`/`chart_date`, yet
  every chart function (`get_weekly_*`, `get_range_*`, `get_artist_list`) filters on exactly
  those columns — forces a full scan of `chart_dates` on every chart request, cascading into
  the join against the much larger `chart_entries` table. Verified directly against
  `get_weekly_song_chart.sql`'s `WHERE chart_dates.chart_id = ... AND chart_dates.chart_date = ...`.

### Medium
- B2. No FK constraints anywhere (`chart_entries`→`chart_dates`,
  `album_list`/`song_list`.`artist_id`→`artist_list`, `chart_dates.chart_id`→`chart_list`) —
  a deliberate tradeoff already documented in `docs/aiven-migration-notes.md` (app does
  lookup-or-insert instead of DB-enforced relations), but worth re-flagging since an orphaned
  row would silently corrupt chart output with nothing to catch it.
- B3. `get_albums_by_artist.sql`/`get_songs_by_artist.sql` compute `peak_weeks` via a per-row
  correlated subquery (N+1 pattern) instead of a windowed/aggregate query.
- B4. `get_range_album_chart.sql`/`get_range_song_chart.sql` use nested cursor loops (outer
  per charted item, inner per week) doing row-by-row arithmetic against `chart_entries`, the
  largest table, instead of a set-based query.
- B5. `get_artist_list`/`get_albums_by_artist`/`get_songs_by_artist` filter
  `artist_list.artist_name` with leading-wildcard `LIKE '%..%'`/`similar to`, which can't use
  a btree index even if one existed.
- B6. `chart_entries_unique_row UNIQUE(source_id, chart_id)` is the only multi-column index on
  the biggest table, but its leading column is `source_id`, not `chart_id` — the frequent join
  from `chart_dates.chart_date_id` can't use it efficiently either.

### Low
- B7. `usp_SEL_ChartEntriesByChart.sql` references `chart_entries.song_id`/`song_rank`,
  columns that don't exist in the current schema (actual columns are `source_id`/`rank`) —
  would error if ever executed, but nothing in the app calls it (verified: only self-reference
  in its own file), so it's unreachable dead/broken legacy code, not an active risk.
- B8. All six JSON-returning functions `CREATE TEMP TABLE ... ON COMMIT DROP` per invocation
  instead of a CTE — minor catalog churn under load.
- B9. `usp_SEL_ChartEntriesByChart` uses Sybase/SQL-Server-style `usp_`/PascalCase naming,
  inconsistent with snake_case `get_*` elsewhere.

---

*Two findings from the initial research pass were downgraded after direct verification:
`ArtistCard.js`'s function-as-setState-argument pattern (confirmed harmless — see C10) and the
`/annual-top-songs` "Select All" fetch-everything path (the route already documents this as an
intentional, bounded ~16-21k-row dataset, not unbounded — not listed as a finding here).*

## Usability

A code-based usability pass (no live browser testing available this session) across
navigation/IA, accessibility, responsive design, and feedback/forms UX (2026-08-09). Note:
CLAUDE.md describes "mobile layout is an ongoing effort" — verified this doesn't yet show up
in the code (zero `@media` queries anywhere in the client, no collapsible nav), so treat that
framing as aspirational, not current state.

### Navigation & Information Architecture

High
- U1. The artist-name table cell — the site's primary way to get from a chart to an artist
  page — has no visual affordance that it's clickable (`components/Table.js`, only
  `cursor:pointer`, no underline/color change). A first-time or touchscreen user has no way to
  discover this from looking at it.
- U2. The chart picker (`ChartMenu.js` → `SingleChartMenu.js` → `TimeFrameMenu.js`) is three
  nested accordions with no explanatory text — a new user must click through blind to learn
  the structure (Song/Album → specific chart → Week/Month/Year/Decade).

Medium
- U3. The "Artists" nav link (`components/Header.js`) routes to a magic sentinel value
  (`/Artist/ABCXYZ`) rather than a real listing route — works today, but the URL is meaningless
  if bookmarked or shared, and the pattern isn't documented anywhere in the code.
- U4. No breadcrumb or "you are here" indicator beyond the current chart's title — browser back
  is the only way to retrace navigation between chart and artist views.
- U5. `/Issues` (Known Issues) is a real route but reachable only via a link buried inside the
  Features page, not the header nav — most users won't find it.
- U6. Search/filter (`Table.js`'s per-column filters) is invisible on the homepage
  (`bFilter={false}`) — no indication a search/filter feature exists until a user is already
  viewing a chart.

Low
- U7. `ChartPage.js`'s `window.onresize` force-navigates back to `/Chart` on breakpoint
  crossing, which can silently reset in-progress filter/pagination state.

### Accessibility

High
- U8. None of the four chart date pickers (`utils/WeekPicker.js`, `MonthPicker.js`, and by the
  same pattern `YearPicker.js`/`DecadePicker.js`) have an associated `<label>` or `aria-label`
  — only `placeholderText`, which disappears once a value is entered and isn't reliably exposed
  to screen readers as a field name.

Medium
- U9. Every page renders two (sometimes three) `<h1>` elements — `Header.js` renders a
  persistent site-title `<h1>Music Historeum</h1>` on every route, and most pages also render
  their own page-title `<h1>` (confirmed: `HomePage.js` alone has two of its own, for three
  total on that page). Screen-reader users navigating by heading level can't distinguish site
  chrome from page content.
- U10. No `aria-live`/`role="status"` anywhere in the client (confirmed: zero matches) — async
  status changes (`CreatePlaylistModal`'s "Searching Apple Music (12 of 500)…", the contact
  form's submit error) update visibly but aren't announced to screen-reader users unless
  they're already focused on that text.
- U11. `components/AlphabetNav.js` uses a real `<NavLink to='#'>` for each A-Z letter filter
  rather than a `<button>` — keyboard-focusable, but announced as a link to assistive tech for
  something that behaves like a toggle/filter, and `href="#"` also jumps scroll position to the
  top of the page on activation.

Low
- U12. A few color combinations look contrast-risky under WCAG AA (`Header.css`: `#7b68ee`
  hover text on `#c3bee5`/`#483d8b` backgrounds; `AnnualTopSongsList.css`: `#888` gray loading
  text on white) — not measured precisely (no contrast-ratio tool available this session),
  worth a manual check.

**Worth noting as a strength, not a gap:** the artist-name table cell (U1 above) is actually
solid on the accessibility axis specifically — it has `role="button"`, `tabIndex={0}`, and
Enter/Space keyboard handling (`Table.js` ~lines 217-233), so keyboard and screen-reader users
can activate it even though sighted mouse users get no visual cue it's clickable. Two different
problems on the same element.

### Responsive Design

High
- U13. Zero `@media` queries exist anywhere in the client (confirmed via repo-wide search). The
  only screen-size handling is two one-off `window.innerWidth` checks (`ChartCard.js`,
  `ChartPage.js`) that run once at mount and never react to resize/rotation — this contradicts
  CLAUDE.md's "mobile layout is an ongoing effort" note; whatever that effort produced isn't
  reflected in the CSS today.
- U14. `Header.js`'s `<Navbar expand='md'>` never pairs with a `NavbarToggler`/`Collapse`
  (confirmed: neither is imported or used anywhere in the file) — reactstrap has no way to
  collapse the nav below the `md` breakpoint, so on a phone all nav items (Charts dropdown,
  Artists, Top Songs by Year, Features, About) render inline/stacked permanently rather than
  behind a hamburger menu.
- U15. `Table.js` renders a plain `<table>` with no horizontal-scroll wrapper — a 7-9 column
  chart table has no way to be usable on a narrow viewport other than overflowing with no
  visible scroll cue.

Medium
- U16. `AnnualTopSongsList`'s CSS grid (`AnnualTopSongsList.css`) uses fixed-width columns
  (including a fixed `16rem` last column) with no narrow-screen fallback.

### Feedback States & Forms

Medium
- U17. The contact form validates only on submit, not as-you-type/on-blur, and has no
  required-field indicators — a user gets no feedback until they hit Submit.
- U18. The contact form's submit button never disables while sending, and success closes the
  modal silently with no confirmation message — a user can't tell whether their message
  actually sent, or double-submit.
- U19. `ArtistCard`'s "no songs/albums found" state is injected as a fake entry into the
  `Chrono` timeline component (`{cardTitle: 'No songs found'}` rendered as a timeline item)
  rather than shown as a normal empty-state message — likely reads as a broken/empty timeline
  card rather than a clear "nothing here" message.

Low
- U20. `CreatePlaylistModal`'s post-run unmatched-songs list shows only titles, with no reason
  each one failed to match.
- U21. Table pagination controls (`«`, `‹`, `›`, `»`) are small, unstyled buttons with no
  touch-target sizing considered for mobile.

**Strengths worth preserving:** `ChartCard`/`ArtistCard`/`AnnualTopSongsList`/
`CreatePlaylistModal` all handle loading, error, and empty states explicitly rather than
rendering blank; `CreatePlaylistModal` shows live progress counts during a long async job and a
clear summary afterward — genuinely good UX for what's normally a hard case to get right; the
contact form's Formik fields are properly `<label htmlFor>`-associated.
