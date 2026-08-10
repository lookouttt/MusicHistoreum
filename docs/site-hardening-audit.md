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

### Done this pass
- C2. `ChartCard.js` assigned `window.onbeforeunload` directly in the render body. Fixed:
  moved into a `useEffect` keyed on `[chartType, chartId, chartTimeframe, chartDate]`, with a
  cleanup that clears the handler on unmount.
- C3. `ChartCard.js`/`ArtistCard.js` fetch effects had no cancellation guard. Fixed: added the
  same `cancelled`-flag pattern already used correctly in `AnnualTopSongsList.js`.
- C8. `TopArtistList.js` put the `key` prop on the inner `<Link>` instead of the `<li>`. Fixed.
- C9. Stray `console.warn` in `songMatcher.js`/`chartsSlice.js`. Fixed: gated behind
  `process.env.NODE_ENV !== 'production'` rather than removed outright, since they're genuinely
  useful during development.
- C1. `songMatcher.js` fired one Apple Music catalog search per selected song with no
  caching/dedup. Fixed: added an in-memory `Map` cache keyed by normalized `title+artist`,
  checked before each search; persists across calls for the page's lifetime, not just within
  one batch. Per the plan's own note, the cache stores an unmatch **reason** alongside the
  match id (not just the id) so a future per-song "why didn't this match" feature (U20) can
  look it up regardless of which occurrence actually triggered the network call.
- C7. `CreatePlaylistModal.js` surfaced raw `err.message` from MusicKit/Apple failures. Fixed:
  added `getFriendlyErrorMessage()`, which passes through the app's own already-friendly error
  text (from `musicKitLoader.js`/`musicKitAuth.js`), recognizes network-shaped failures, and
  falls back to a generic message for anything else rather than showing raw SDK internals.
- C4. `client/src/app/assets/img/` had several unoptimized JPEGs (up to 3MB each) and one
  unused legacy banner. Fixed: resized the 6 actually-referenced background images (confirmed
  via grep against `App.css`) to a 1920px max dimension and re-compressed (quality 78,
  progressive) — combined 7.85MB → 1.28MB, visually spot-checked for quality. Deleted
  `main_banner_old.jpg` after confirming zero references anywhere in the codebase.
- C5. *(decision: swap font-awesome now, defer the bigger styling-architecture question)*
  Font-awesome's actual footprint turned out to be just 5 icon usages across 4 files
  (`fa-home` ×2, `fa-address-book`, `fa-music`, `fa-comment`). Replaced with a small
  `components/Icon.js` using inline SVGs (Google Material Design Icons paths, Apache-2.0,
  solid/filled style to match font-awesome's original visual weight) — no new dependency added,
  one removed. Verified via a real production build: CSS bundle shrank ~6.9KB gzipped, and no
  font-awesome assets remain in the build output. The larger three-styling-systems question
  (bootstrap + reactstrap + styled-components) is explicitly deferred, not decided here.
- C6. *(decision: keep `.env.production`/`.env.development` committed)* Both files hold only a
  public API base URL today. Added an explicit comment in both files plus a `CLAUDE.md` note:
  never put a secret in either, since anything there ends up in the public client bundle
  regardless of whether the file is committed.
- C11. *(decision: leave the commented-out dates, no code change)* Correction to the original
  finding: the unresolved Saturday/Monday pre-1962 chart-day question actually lives in
  `CLAUDE.md`'s "Known in-progress issues," not `KnownIssuesPage.js` (that page doesn't mention
  it at all). Since it's a real open research question (which day of week Billboard used
  pre-1962), not something safely resolvable without that research, the commented-out
  `FirstDate` values in `SONG_CHARTS.js` stay as a placeholder for whenever it's resolved.
- C10. *(Phase 8, done alongside U19 — both touched the same lines)* `ArtistCard.js`'s "no
  songs/albums found" branches called `setSongItems`/`setAlbumItems` with a zero-arg function
  instead of the array directly — worked only because React's functional-updater form happens to
  invoke it and use the return value. Fixed: now sets a plain `[]` directly, which doubles as the
  "no results" signal for U19's empty-state rendering below.

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

### Done this pass (Phase 6)
- U1. Added a `.artist-link-cell` CSS class (light lavender `#f0e6ff`, underlined, brightening
  to white on hover/focus) to `Table.js`'s clickable artist-name cell, alongside its existing
  `role="button"`/keyboard handling — now visually reads as interactive, not just cursor-only.
- U8. Correction to the original finding: react-datepicker does **not** forward an arbitrary
  `aria-label` prop to its underlying input (verified directly against the installed package —
  it only forwards the explicitly-named `ariaLabelledBy`/`ariaDescribedBy`/`ariaInvalid`/
  `ariaRequired`, not a raw `aria-label`). Fixed with the audit's other suggested approach
  instead: a proper visually-hidden `<label htmlFor>` + matching `id` on each of the four
  pickers (`WeekPicker`, `MonthPicker`, `YearPicker`, `DecadePicker`).
- U9. `Header.js`'s site-title `<h1>` stays the page's only real h1; every page-title heading
  (`HomePage.js` ×2, `AboutPage.js`, `FeaturesPage.js`, `KnownIssues.js`, `ArtistList.js`,
  `ArtistCard.js`, `ChartCard.js`, `AnnualTopSongsList.js`) changed to `<h2>`. No visual change:
  `App.css` already styles `h1, h2, h3` identically.
- U10. Added `role="status" aria-live="polite"` to `CreatePlaylistModal.js`'s in-progress status
  paragraph, and `role="alert" aria-live="assertive"` to its error paragraph and the contact
  form's submit-error paragraph.
- U11. `AlphabetNav.js`: replaced the react-router `<NavLink to='#'>` per letter with a real
  `<button type="button">`, with a small CSS reset (`border: none; background: none;`) so the
  visual appearance is unchanged — removes both the link/button semantic mismatch and the
  `href="#"` scroll-jump.
- U12. Measured contrast precisely (WCAG relative-luminance formula) rather than eyeballing, and
  found **two** real AA failures, not just the one the audit guessed at. `AnnualTopSongsList.css`'s
  `#888` loading-text gray on white measured 3.54:1 (needs 4.5:1) — replaced with `#767676`
  (4.54:1, the standard "darkest AA-safe gray on white"). `Header.css`'s `#7b68ee` bottom-nav
  hover text on its `#483d8b` background measured only **2.18:1** — failed far worse than
  expected — replaced with a lighter lavender tint, `#c9c2f7` (5.42:1).
- U22. `AppleMusicPlaylistToolbar.js`'s wrapping `<div>` now has a semi-opaque
  `rgba(255, 255, 255, 0.85)` background plus padding/border-radius, so its outline buttons no
  longer wash out against the page photo. Also widened the custom-count `<input>` from 70px to
  90px so its "Custom" placeholder no longer renders truncated.
- U26 / U27. *(decision: delegated to an Opus 5 subagent, per the user's explicit choice)* Chose
  option (c), a small reused set grouped by section, after finding the original per-page mapping
  was arbitrary (genre photos on pages with no genre connection) and that two of the six original
  images had real quality problems under the shared dimming overlay (`vinyl-1894855_960_720.jpg`
  is only 960×720, visibly soft full-viewport; `country.jpg`'s light upper region reads
  mid-grey at `brightness(50%)`, the worst text-contrast case of the set). Consolidated to two
  images in `App.css`: `vinyl-1595847.jpg` for data/chart pages (`HomePage`, `ChartPage`,
  `ArtistPage`, and now `AnnualTopSongsPage` — fixing U26's missing-rule gap) and
  `concert-316464.jpg` for informational pages (`AboutPage`, `FeaturesPage`,
  `KnownIssuesPage`). Left a comment in `App.css` documenting the two-group rule for future
  pages. No images deleted — the six now-unreferenced files stay on disk (confirmed zero other
  references via repo-wide grep) as future candidates; CRA only bundles what's referenced, so
  bundled image payload dropped from ~1.28MB to ~406KB. Verified with a real production build.

### Done this pass (Phase 7)
- U14. Added reactstrap's `NavbarToggler` + `Collapse` (local `isOpen` state) to both `<Navbar>`s
  in `Header.js`. Also added `dark` to the bottom nav (previously undeclared) so its toggler icon
  renders in white against the `#483d8b` background instead of Bootstrap's default dark icon.
- U13. Fixed the two root causes: `ChartCard.js`'s `hiddenColumns` decision now reads from a real
  `isNarrowScreen` state kept in sync by a `resize` listener (with cleanup) instead of reading
  `window.innerWidth` once at render time — it now actually reacts to rotation/resize, which was
  the concrete bug. Added real `@media` breakpoints for the other verified narrow-viewport
  problems found by direct inspection: `App.css`'s `background-attachment: fixed` (known to be
  unreliable/laggy on mobile Safari) falls back to `scroll` under 768px; `Header.css`'s site-title
  shrinks under 480px so "Music Historeum" doesn't overflow its fixed-height banner;
  `ArtistCard.css`'s hardcoded `min-width: 340px` (wider than a 320px-class phone viewport) drops
  under 400px.
- U7. Removed `ChartPage.js`'s `window.onresize`/`largeScreen` re-navigation hack entirely rather
  than just preserving state before navigating — it existed only to force a re-render so
  `ChartCard` would recompute `hiddenColumns` at the new width, which U13's fix now does directly
  and correctly. No workaround needed once the root cause was fixed.
- U15. `Table.js`'s `<table>` is now wrapped in a `<div style={{ overflowX: 'auto' }}>`, so wide
  chart tables scroll horizontally on narrow viewports instead of overflowing the page.
- U16. Added a `@media (max-width: 768px)` override in `AnnualTopSongsList.css` that shrinks the
  grid's fixed `16rem` last column to `minmax(7rem, 10rem)` (and the appearance sub-grid to
  match) — kept the same row structure/height on purpose, since the virtualized list
  (`AnnualTopSongsListBody.js`) computes row heights in JS to match this CSS exactly; changing
  the layout to stack vertically instead would have required duplicating that breakpoint logic
  in JS too.
- U25. Removed `usePagination` from `Table.js` entirely — dropped the page-size dropdown and
  page-flip button row, and the now-dead `.pagination`/`.pagination2` CSS from `ChartStyles.js`/
  `ArtistStyles.js`. Rows now render directly from react-table's unpaginated `rows`. One
  dependency found and preserved during implementation, not called out in the original finding:
  `HomePage.js`'s two chart previews relied on `usePagination`'s `pageSize` as a side-channel
  "show only the first N rows" cap (`bPage={false}` just hid the controls, but the slice still
  applied) — replaced with an explicit `maxRows` prop on `Table.js` so the homepage previews
  still cap to 10 rows without reintroducing pagination machinery to do it.
- U21. Moot per the plan's own note — table pagination buttons no longer exist after U25, so
  there's nothing left to resize for touch targets.

### Done this pass (Phase 8)
- U2. Added a one-line hint above `ChartMenu.js`'s accordion: "Pick a chart type, then a
  specific chart, then a timeframe."
- U24. Replaced the hardcoded `#bottomNavItems1`-`#bottomNavItems4` ID selector list in
  `Header.css` with a shared `.bottomNavItem` class applied to all nav items in `Header.js`
  (including the previously-orphaned `Top Songs by Year` and the new `/Issues` link from U5) —
  removes the "forgot to add a new item to the list" failure mode entirely.
- U3. *(decision: add a real dedicated route, not just a named constant)* Added a real
  `/Artists` route in `App.js` for the browse view; `ArtistPage.js` now shows `<ArtistList/>`
  when there's no `:artist` route param and `<ArtistCard/>` when there is, instead of branching
  on an `'ABCXYZ'` sentinel string duplicated in both `Header.js` and `ArtistPage.js`. `/Artists`
  is now a real, meaningful, bookmarkable URL.
- U4. *(decision: a simple browser-back link, not full breadcrumb/route-state plumbing)* Added a
  "← Back" button to `ArtistCard.js` that calls `navigate(-1)`. Deliberately lighter than
  carrying the originating chart through React Router route state — works for any entry path
  (chart click, Annual Top Songs, alphabet browse) with no plumbing changes elsewhere.
- U5. Added a `NavItem`/`NavLink` to `/Issues` in `Header.js`, matching the existing nav pattern
  (labeled "Known Issues" to match the page's own title) — done together with U24 since both
  touch the same nav-item list.
- U6. *(decision: enable filtering, not just a hint)* Set `bFilter={true}` on both of the
  homepage's chart preview tables. Filtering still operates on the full fetched chart (via
  `useFilters`/`useGlobalFilter`) before the preview's existing `maxRows` cap slices it down to
  10, so a homepage search correctly matches against the whole chart, not just the visible rows.
- U17 / U18. Added required-field indicators (`*`) next to the four required labels
  (`validateContactForm.js` confirms exactly firstName/lastName/email/commentText are required);
  the submit `<Button>` now disables and reads "Sending…" while `isSubmitting` (switched
  `<Formik>` to the render-prop form to access it, and `handleSubmit` now explicitly calls
  `setSubmitting(false)` in a `finally` block); and a success state now shows "Thanks! Your
  message has been sent." with an explicit Close button instead of silently closing the modal.
  Formik's `validateOnBlur`/`validateOnChange` were already both `true` by default (the audit's
  premise that the form "validates only on submit" didn't hold up under direct inspection — no
  code here overrides those defaults) — the real gap was just the missing required-field
  indicators and the two feedback-state issues (U18), not validation timing.
- C10 / U19. See C10 in the Client section above — fixed together since both touch the same
  `ArtistCard.js` lines. `setSongItems`/`setAlbumItems` now set a plain `[]` for "no results"
  instead of the fake `Chrono` timeline entry, and the JSX renders a plain
  `<p>No songs found for this artist.</p>` (or albums) when the array is empty, instead of
  feeding a fake item into the timeline component.
- U20. `songMatcher.js`'s `matchSongsToAppleMusic` already computed a per-song unmatch reason
  (added in Phase 5's C1 cache work) but discarded it before returning — `unmatched` was just
  the bare song list. Threaded the reason through `unmatched` → `createAppleMusicPlaylist.js`'s
  return value → `CreatePlaylistModal.js`'s post-run list, which now shows e.g. "Song — Artist —
  No catalog match found for this song/artist." instead of just the title.
- U23. Replaced `AppleMusicPlaylistToolbar.js`'s three preset buttons + separate custom input +
  Apply button with a single `<select>` (`50 / 75 / 100 / All / Custom…`) that only reveals the
  custom number input + Apply button when "Custom…" is chosen. "All" calls the existing
  `onSelectTopN` callback with `Infinity`, which the existing `row.song_rank <= n` filter already
  handles correctly with no changes needed elsewhere.

### Navigation & Information Architecture

All findings from this section (U2, U3, U4, U5, U6, U24) are done — see "Done this pass" above.

### Accessibility

**Worth noting as a strength:** the artist-name table cell is solid on the accessibility axis —
it has `role="button"`, `tabIndex={0}`, and Enter/Space keyboard handling (`Table.js`
~lines 217-233), and (as of U1 above) now has a visual affordance to match, so both keyboard/
screen-reader and sighted mouse users can tell it's interactive.

### Responsive Design

All findings from this section (U13, U14, U15, U16) are done — see "Done this pass" above.

### Feedback States & Forms

All findings from this section (U17, U18, U19, U20) are done — see "Done this pass" above.

**Strengths worth preserving:** `ChartCard`/`ArtistCard`/`AnnualTopSongsList`/
`CreatePlaylistModal` all handle loading, error, and empty states explicitly rather than
rendering blank; `CreatePlaylistModal` shows live progress counts during a long async job and a
clear summary afterward — genuinely good UX for what's normally a hard case to get right; the
contact form's Formik fields are properly `<label htmlFor>`-associated.

### Visual Design Consistency

Raised directly from live-site review: the user felt the site's per-page background-image
approach reads as inconsistent, using `AnnualTopSongsPage`'s plain white background as the
concrete example. Both findings from this section (U26, U27) are done — see "Done this pass"
above.

### Apple Music Playlist Toolbar

Found via direct visual review of the live chart page (screenshot), not code inspection alone
— confirmed against `AppleMusicPlaylistToolbar.js` afterward. Both findings from this section
(U22, U23) are done — see "Done this pass" above.
