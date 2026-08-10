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
- S11. The contact form's outbound mail was completely dead (the A2 Hosting account behind
  `mail.musichistoreum.com` was no longer active — see prior finding text below for the full
  repro). Fixed: switched the nodemailer transport (`server/index.js`) from
  `mail.musichistoreum.com` to Gmail SMTP (`smtp.gmail.com:465`, `secure: true`), and corrected
  the outgoing `from` field to include a real address matching the authenticated account
  (`"${name}" <${MAIL_USER}>` instead of a bare display name) — Gmail's relay requires the
  From address to match the authenticated account/alias, which the old A2 transport didn't
  enforce. **Confirmed live in production**: `MAIL_USER`/`MAIL_PASSWORD` set to a real Gmail
  address and App Password in both `server/.env` and Vercel, deployed, and verified via a real
  `POST /contact` against production that delivered to the inbox.
- S1. `POST /contact` had no rate limiting. Fixed: added a dedicated `express-rate-limit`
  instance (5 requests/hour/IP, same pattern as D1's dev-token limiter, no shared-secret
  bypass since there's no legitimate non-browser caller for this route).
- S4. `/contact` logged the raw payload (`logger.info(req.body)`) — name/email/message
  persisted in plaintext to `mh_server.log` indefinitely. Fixed: removed the log line entirely.
- S2. No rate limiting on any other public DB-backed read route (`/chartList`,
  `/artist/list/:start_char`, `/artist/:dartist/:dtype`, `/chart/:cid/:ctype/:ctf/:cdate`,
  `/annual-top-songs`). Fixed: added a shared `express-rate-limit` instance (100 requests/15min
  per IP) applied directly to each of those five routes.
- S3. `db.js`'s `pg` Pool set no `statement_timeout`/`query_timeout`. Fixed: added
  `statement_timeout: 10000` to the `Pool` config.
- S5. No baseline security headers. Fixed: `app.use(helmet())` added ahead of the other
  middleware; confirmed via a local response showing `Content-Security-Policy`,
  `Strict-Transport-Security`, `X-Content-Type-Options`, and `X-Frame-Options` all present.
- S6. `get_weekly_${chartType}_chart`/`get_range_${chartType}_chart` built the function name by
  string interpolation of `chartType`. Fixed: replaced with explicit
  `WEEKLY_CHART_FUNCTIONS`/`RANGE_CHART_FUNCTIONS` lookup objects keyed by `Song`/`Album`.
- S7. Winston's `logger.info('label', value)` multi-arg calls were silently dropping the second
  argument. Fixed: added `splat()` to the format `combine(...)` chain.
- S8. Root `.gitignore` only ignored the literal `server/mh_server.log`. Fixed: widened to
  `server/*.log` (confirmed no other tracked `.log` files under `server/` were affected).
- S9. `/artist/:dartist/:dtype` silently treated any `dtype` other than exactly `'songs'` as an
  albums request. Fixed: explicit `dtype === 'songs' || dtype === 'albums'` check, `422`
  otherwise.
- S10. `/chart/.../:cdate` didn't validate `cdate` parses to a real date before hitting
  `dayjs`/Postgres. Fixed: strict `dayjs(chartDate, 'YYYY-MM-DD', true).isValid()` check (via
  the bundled `customParseFormat` plugin) before proceeding, `422` on failure. All Phase 2
  changes tested against a local server run: helmet headers confirmed present, valid/invalid
  `dtype` and `cdate` inputs return the expected 200/422, `RateLimit-*` headers confirmed on
  the newly-limited routes, and existing Song/Album weekly/range chart lookups still return
  correct data through the new lookup objects.

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

### Done this pass
- P8. `sync_to_aiven.py`'s `load_env` didn't strip quotes from values, unlike
  `annual_top_songs.py`'s near-duplicate implementation. Fixed: extracted the quote-stripping
  version into a shared `bb_script/env_utils.py`, imported by both `sync_to_aiven.py` and
  `annual_top_songs.py` in place of their separate copies.
- P1. Hardcoded plaintext Postgres password in `bb_scrape.py`'s `DB_CONN_STRING` — the file is
  git-tracked (not ignored), so the credential was committed to history; the same password is
  also duplicated in `bb_script/.env`. Fixed: `bb_scrape.py` now reads `SOURCE_SERVICE_URI`
  from `bb_script/.env` via the shared `env_utils.load_env` helper (P8 above) instead of a
  hardcoded string — no new env var introduced, since `bb_script/.env` already had this exact
  connection string for `sync_to_aiven.py`. The old committed password is now fully rotated:
  the local `postgres` role's password was changed via `ALTER USER` and confirmed working
  end-to-end (`server/.env`, `bb_script/.env` updated), and the Aiven `avnadmin` password was
  reset via the Aiven console (not raw SQL, since Aiven manages that credential centrally),
  `bb_script/.env`'s `TARGET_SERVICE_URI` updated, and production re-verified live against
  `GET /chartList` on the server's actual Vercel deployment after the required redeploy.
- P2. `bb_scrape.py`'s per-item insert loop (`getArtistId`/`insertSong`/`insertAlbum`/
  `insertChartEntry`) had no exception handling — only the chart-date fetch was wrapped, so a
  DB error mid-chart (e.g. a dropped connection) crashed the whole scrape run uncaught. Fixed:
  wrapped the per-item block in try/except, log-and-continue (plus a rollback + reconnect) on a
  `psycopg2.Error`, matching the tolerance philosophy already used for the empty-week retry
  logic. Verified via a real scoped run (`BB_SCRAPE_ONLY`) against two real historical weeks.
- P3 / P9. `bb_scrape.py` had **17** unclosed `conn.cursor()` calls (not 13 as originally
  counted — corrected via direct count), and `retrieveChartIds` also leaked its `billboard.txt`
  file handle on error. Fixed: every cursor now uses `with conn.cursor() as cur:`, and the file
  handle uses `with open(...) as f:`. Verified via the same real scoped test run above — every
  cursor site got real exercise (lookups, inserts, updates, and the duplicate-conflict path)
  with no `InterfaceError`/crashes, and the chart's `next_date`/`last_date` ended up back at
  their exact pre-test values.
- P4. `time.sleep(10)` was repeated 3x as an unnamed magic number. Fixed: introduced
  `SCRAPE_DELAY_SECONDS = 10` near the top of `bb_scrape.py`, replacing all three call sites.
- P6. Of the three files named, only `sync_to_aiven.py` actually interpolates table/column
  names into SQL via f-strings (verified directly: `migrate_chart_entries.py` and
  `annual_top_songs.py` only use f-strings for log/print messages, not SQL — the original
  finding overstated the scope). Fixed: added `KNOWN_TABLES`/`KNOWN_COLUMNS` allow-lists
  (derived from the existing `APPEND_ONLY_TABLES`/`FULL_REFRESH_TABLES` dicts) and an
  `_assert_known_identifiers` check before every f-string-built query. Verified: rejects a
  SQL-injection-shaped table name and an unknown column name with an `AssertionError`, and a
  real full sync run against Aiven completed normally afterward.
- P7. `weekly_update.bat` hardcoded `C:\Users\looko\...` and appended to
  `logs\weekly_update.log` indefinitely with no rotation. Fixed: replaced the hardcoded path
  with `%USERPROFILE%`, and added a size check (5MB threshold) that rotates the log to
  `.log.old` before a run starts if it's grown past that. Verified both branches directly
  (oversized log rotates, small log doesn't) with a throwaway test harness.
- P5. Added a module docstring and per-function docstrings to `bb_scrape.py`'s previously
  undocumented functions. Also switched `logging.basicConfig` to log to both the file and
  console (`StreamHandler`) and removed the one genuinely duplicate `print()`/`logging.info()`
  pair (identical "Now starting %s" message) in favor of the single logging call — the other
  print/logging pairs in the file were left alone since their messages actually differ (print
  gives terse console feedback, logging captures full exception detail), so they aren't truly
  redundant.

## Database (`db/functions/*.sql`, `db/tables/*.sql`)

### Done this pass
- B1. `chart_dates` had a PK only on `chart_date_id`; no index on `chart_id`/`chart_date`, yet
  every chart function (`get_weekly_*`, `get_range_*`, `get_artist_list`) filters on exactly
  those columns. Fixed: `idx_chart_dates_chart_id_date` on `(chart_id, chart_date)`. Verified
  via `EXPLAIN ANALYZE`: the weekly chart lookup went from a ~297ms Parallel Seq Scan on both
  `chart_dates` and `chart_entries` to a ~0.2ms Index Scan, both locally and on Aiven.
- B6. `chart_entries_unique_row UNIQUE(source_id, chart_id)` was the only multi-column index on
  the biggest table, but its leading column was `source_id`, not `chart_id` — the frequent join
  from `chart_dates.chart_date_id` couldn't use it efficiently. Fixed: added
  `idx_chart_entries_chart_id_source` on `(chart_id, source_id)`, applied alongside B1 since
  both serve the same join path (confirmed together in the same `EXPLAIN ANALYZE` above). This
  index is ~107MB on `chart_entries`'s ~4.85M rows — large enough that, combined with B1,
  it exhausted Aiven's disk quota mid-session and required a plan upgrade before B5 below could
  proceed (see CLAUDE.md's "Database schema tracking" section).
- B5. `get_artist_list`/`get_albums_by_artist`/`get_songs_by_artist` filtered
  `artist_list.artist_name` with leading-wildcard `LIKE '%..%'`/`similar to`, which can't use a
  btree index. Fixed: enabled `pg_trgm` and added a GIN trigram index,
  `idx_artist_list_artist_name_trgm`. Verified via `EXPLAIN ANALYZE`: the planner now uses a
  Bitmap Index Scan instead of a Seq Scan for this pattern.
- B7. `usp_SEL_ChartEntriesByChart.sql` referenced `chart_entries.song_id`/`song_rank`, columns
  that don't exist in the current schema (actual columns are `source_id`/`rank`) — unreachable
  dead/broken legacy code (verified: nothing in the app called it). Fixed (decision: drop it):
  `DROP PROCEDURE` on both the local and Aiven databases, and deleted
  `db/functions/usp_SEL_ChartEntriesByChart.sql`.
- B9. Moot — the procedure it would have renamed no longer exists (see B7).
- B2. No FK constraints anywhere (`chart_entries`→`chart_dates`,
  `album_list`/`song_list`.`artist_id`→`artist_list`, `chart_dates.chart_id`→`chart_list`) — a
  deliberate tradeoff already documented in `docs/aiven-migration-notes.md` (app does
  lookup-or-insert instead of DB-enforced relations). Fixed (decision: leave as-is, add
  detection): added `db/queries/orphan_row_audit.sql`, a manual/periodic query covering all
  five of the schema's implicit parent/child relationships (including the non-obvious
  `chart_entries.chart_id` → `chart_dates.chart_date_id` mapping, and the type-dependent
  `chart_entries.source_id` → `song_list`/`album_list` split). Run against Aiven and confirmed
  zero orphans currently exist.
- B3. `get_albums_by_artist.sql`/`get_songs_by_artist.sql` computed `peak_weeks` via a per-row
  correlated subquery (N+1 pattern) instead of a windowed/aggregate query. Fixed: rewritten as
  a single set-based query (`min(rank) over (partition by ...)` + `count(*) filter (where rank
  = peak)`), delegated to an Opus 5 subagent given the correctness stakes. Verified: 517 test
  cases / 50,344 rows compared against the original, zero value differences; deployed to Aiven.
- B4. `get_range_album_chart.sql`/`get_range_song_chart.sql` used nested cursor loops (outer
  per charted item, inner per week) doing row-by-row arithmetic against `chart_entries`, the
  largest table, instead of a set-based query. Fixed: rewritten as one query using
  `row_number()` for the chronological occurrence counter and a single `sum()` of CASE terms
  for the point-scoring algorithm. Verified extensively (Opus 5 subagent): 129 test cases /
  88,423 rows across Month/Year/Decade ranges, threshold-crossing charts, and edge cases
  (empty/inverted/single-day ranges, nonexistent chart ids), zero value differences; a 5-mutant
  test (deliberately reintroducing plausible wrong rewrites) confirmed the verification suite
  would have caught each one. Deployed to Aiven; incidentally 2.2–4.9x faster.
  - **Found during the rewrite, deliberately preserved as-is (see B10 below):** the original
    `pointFactor` was declared as PL/pgSQL `integer`, so assigning `0.6`/`0.4` to it rounded to
    `1`/`0` — the "reduced weight for smaller charts" logic has always been a binary 1-or-0
    switch in production, not the tiered 1/0.6/0.4 the code visually suggests. The rewrite
    reproduces this exact behavior (with an explanatory comment in the SQL) rather than
    silently correcting it, since fixing it would shift point totals/rankings for every range
    chart ever computed.
  - **One deliberate behavior change:** added a final `song_id`/`album_id` tie-breaker to the
    `ORDER BY`. The original's rank for fully-tied rows (`points`, `peak`, `weeks` all equal)
    was confirmed to depend on the query's execution plan (verified: changed under
    `enable_hashagg=off`/different `work_mem`) - not a stable, well-defined output to begin
    with. This matters because `bb_script/annual_top_songs.py` persists `song_rank` as
    `year_rank` and cuts at `song_rank <= top_n`, so an unstable rank could churn which tied
    song makes the cut on a rerun. Already-completed `annual_top_songs` years are frozen and
    may still reflect an old, differently-tied-broken order until recomputed
    (`populate_annual_top_songs(conn, force=True)`).

- B8. `CREATE TEMP TABLE ... ON COMMIT DROP` per invocation instead of a CTE. Turned out to only
  still apply to `get_artist_list.sql` by the time this was picked up — B3/B4's rewrite had
  already eliminated the pattern from the other four functions as a side effect (the original
  "all six" count doesn't hold up under direct verification, likely an artifact of an earlier,
  less-precise research pass). Fixed: rewrote as a single `WITH artist_table AS (... UNION
  ...) SELECT ...` CTE. Verified: 9 test cases (every branch: `!`, digit, upper/lowercase
  letter, `*`, space, `0`) diffed byte-for-byte identical between old and new, both locally and
  confirmed live against production.

### Decision (deferred)
- B10. *(new, found during B4's rewrite)* The `pointFactor` integer-rounding quirk above (1/1/0
  instead of the visually-intended 1/0.6/0.4) is live production behavior, not a rewrite bug —
  preserved as-is for now. User wants to compare old-vs-new point totals/rankings with the
  correct fractional weights before deciding whether to actually change it. To reproduce the
  "corrected" version for comparison: in `get_range_song_chart`/`get_range_album_chart`'s
  `point_factor` CASE expression, change the type from implicit integer to `numeric` and use
  the real values instead of the current 1/1/0: songs' thresholds are `item_count >=75 → 1`,
  `>=50 → 0.6`, else `0.4`; albums' are different, `item_count >=150 → 1`, `>=100 → 0.6`, else
  `0.4`. Run both versions (e.g. one as a temporary differently-named function) against the
  same chart/range and diff `points`/rank output before deciding whether to replace production
  behavior.

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
- U24. Confirmed via screenshot: the header's five bottom-nav items (`Charts`, `Artists`,
  `Top Songs by Year`, `Future Features`, `About the Site`) all render via the same
  `NavLink className='nav-link'` in `Header.js`, but the boxed-button look (white text, border,
  padding, hover color) is applied entirely through a hardcoded CSS ID selector list in
  `Header.css` (`#bottomNavItems1, #bottomNavItems2, #bottomNavItems3, #bottomNavItems4`).
  `Top Songs by Year` was given `id='bottomNavItems2b'` (to slot between Artists=2 and
  Features=3) — which isn't in that selector list — so it silently falls back to reactstrap's
  plain blue link style instead of matching its four siblings.

Medium
- U3. The "Artists" nav link (`components/Header.js`) routes to a magic sentinel value
  (`/Artist/ABCXYZ`) rather than a real listing route — works today, but the URL is meaningless
  if bookmarked or shared, and the pattern isn't documented anywhere in the code.
- U4. No breadcrumb or "you are here" indicator beyond the current chart's title — browser back
  is the only way to retrace navigation between chart and artist views.
- U5. `/Issues` (Known Issues) is a real route but reachable only via a link buried inside the
  Features page, not the header nav — most users won't find it.
- U25. Regular chart tables (`Table.js`, used by `ChartCard`/`ArtistCard`) require picking a
  page size from a "Show 10/20/30/40/50" dropdown and manually flipping through pages, unlike
  the newer Annual Top Songs page's continuous-scroll list — raised directly during live-site
  review as an inconsistency worth evaluating. Regular chart datasets are already fetched in
  full in one response and are far smaller than Annual Top Songs' (Weekly ≤100 rows, even
  Decade ranges are at most a few hundred to low-thousands of unique songs — nowhere near
  Annual Top Songs' ~16-21k), so matching Annual Top Songs' full `react-window` virtualization
  isn't necessary to fix this: rendering the complete already-fetched result set as one
  continuously scrollable list would remove the manual "how many to show" decision and give one
  consistent browsing pattern site-wide, without the added complexity server-side pagination
  would require for a dataset this size.
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

### Visual Design Consistency

Raised directly from live-site review: the user felt the site's per-page background-image
approach reads as inconsistent, using `AnnualTopSongsPage`'s plain white background as the
concrete example.

High
- U26. `AnnualTopSongsPage` was never wired into the per-page background-image system in
  `App.css`. Every other page sets `data-urltype='X'` on its `.mh-background` section with a
  matching `[data-urltype='X']::before { background-image: ... }` rule (`ChartPage`,
  `HomePage`, `ArtistPage`, `FeaturesPage`, `AboutPage`, `KnownIssuesPage` all have one) — no
  such rule exists for `AnnualTopSongsPage`, confirmed in `App.css`. The `::before` overlay
  still applies (`filter: brightness(50%)`, fixed positioning) with nothing behind it, so the
  page renders on a plain white background instead of the themed-photo treatment every other
  page gets. Same "new page added, forgot to update the existing hardcoded selector list"
  pattern as U24.

Decision (not a quick fix)
- U27. Beyond the immediate gap above: is a different themed photo per page (vinyl records, a
  concert crowd, genre-specific photos, each dimmed 50% via a shared overlay) still the right
  direction, or would a more visually consistent treatment — e.g. one shared background across
  all pages, or a small, deliberately-reused set of treatments instead of one per page — read
  as more cohesive? A design-direction call, not a mechanical fix; the existing `data-urltype`
  mechanism supports either outcome once decided.

### Apple Music Playlist Toolbar

Found via direct visual review of the live chart page (screenshot), not code inspection alone
— confirmed against `AppleMusicPlaylistToolbar.js` afterward.

High
- U22. `AppleMusicPlaylistToolbar.js`'s wrapping `<div>` has no background of its own and sits
  directly on the page's photo background — reactstrap's `outline` buttons (designed for a
  solid background) wash out and become hard to read against it. Confirmed in the same
  screenshot: the custom-count `<input>`'s hardcoded `width: '70px'` is too narrow for its
  "Custom" placeholder at the current font size, rendering as a visibly truncated "Custo".

Medium
- U23. The "Select top" control cluster (three preset buttons + a separate custom number input
  + a separate "Apply" button) packs five discrete controls into one row with no visual
  grouping, making it unclear which control does what at a glance. Recommend consolidating into
  a single dropdown (`50 / 75 / 100 / All / Custom…`) that reveals one inline number input only
  when "Custom…" is selected.
