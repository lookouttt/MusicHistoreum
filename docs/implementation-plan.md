# Implementation Plan — Site Hardening & Usability Audit

Turns every item in `docs/site-hardening-audit.md` into a concrete implementation step.
Organized the same way as the audit (Server, Client, Python ingestion, Database, Usability),
with a suggested execution order up front. Item IDs (S1, C1, P1, B1, U1, ...) match the audit
doc exactly — cross-reference there for the original finding/severity/rationale; this doc is
just the "how."

`D1` (`/apple-music/developer-token` rate limiting) is already implemented and isn't repeated
here. **Phases 1 and 2 are both fully complete and confirmed live in production** (`S1`, `S4`,
`S11`, `P8`, `P1`, `S2`, `S3`, `S5`, `S6`, `S7`, `S8`, `S9`, `S10`) and are no longer listed in
the phase table below — see their entries in the Server/Python detail sections for what changed.
Note: this whole effort had been sitting on an unmerged feature branch for weeks before Phase 1
was pushed to `master` — if picking this back up after a gap, confirm `git branch --contains`
for the latest relevant commit actually includes `master` before assuming something is live.
**Phase 3 is also fully complete** (`B1`, `B2`, `B5`, `B6`, `B7`, `B8`, `B9`, `B3`, `B4` — all
live on both the local and Aiven databases; DB/schema changes have no separate "deploy" step,
unlike server code) and is no longer listed in the phase table below. One new item, `B10`, was
added as a deferred decision (not a phase-blocking task) from a finding B4's rewrite surfaced —
see its entry in the Database section. **Phase 4 is complete too** (`P2`, `P3`, `P9`, `P4`,
`P6`, `P7`, `P5`), verified via a real scoped scrape run and a real full sync run rather than
just a syntax check — also no longer in the phase table. **Phase 5 is complete except C10**
(`C1`-`C9`, `C11` all done; C10 stays deferred to Phase 8 as originally planned, alongside
U19) — verified via real production builds, not just syntax checks. C5's font-awesome swap
happened on Sonnet rather than Opus, since its actual footprint (5 icons) turned out small
enough to not need the extra reasoning depth; the larger styling-consolidation question that
*would* warrant Opus was explicitly deferred, not decided. **Phase 6 is complete** (`U1`, `U8`,
`U9`, `U10`, `U11`, `U12`, `U22`, `U26`, `U27` all done) — verified via a real production build.
U27's background-direction decision was delegated to an Opus 5 subagent per the user's explicit
choice, working in an isolated git worktree; its result was reviewed and merged in directly. Two
findings turned out worse under direct measurement than the original audit guessed: U8's
`aria-label` fix (react-datepicker doesn't actually forward that prop) and U12's nav-hover
contrast (2.18:1 measured, not just the `#888` gray the audit flagged as "likely").

## How to use this

Work isn't sequenced by the audit's severity labels alone — some Highs are one-line config
changes and some Mediums are multi-day rewrites. The phases below sequence by a mix of risk,
effort, and dependency (e.g. the `chart_dates` index in Phase 3 should land before the SQL
function rewrites later in the same phase, since the rewrites benefit from it too).

A few items are marked **(decision)** below and in their detail section — these need a choice
from you before any code gets written, not just an implementation.

A handful of items are listed under a different phase than their ID prefix's home area would
suggest, because they must be done in the same sitting as a dependency partner rather than on
their own area's schedule — e.g. **C10** sits in Phase 8 next to **U19**, not Phase 5, since
both touch the exact same lines in `ArtistCard.js`. Each is cross-referenced at both ends so
it's not a surprise either way you encounter it.

**S11** (the contact form's mail transport was completely dead, not just unhardened) was the
highest-priority item in the whole plan for that reason — it was a fully broken user-facing
feature, not a hardening gap — and is now done (see above). **U17/U18** (Phase 8) were marked
to sequence after S11 since they assume the form works at all; that's no longer a blocker now
that S11 is live.

## Model recommendations

Sonnet 5 (the default for this plan) is fine for the large majority of items — mechanical,
well-specified work (config additions, prop fixes, CSS rules, rate limiters, cursor/file-handle
wraps). Two categories are worth stepping up to Opus 5 for, flagged inline below as
**(consider Opus 5)**:

- **B3 / B4** — rewriting the artist `peak_weeks` and range-chart SQL functions from cursor
  loops to set-based window functions. This is the plan's highest-stakes correctness work — a
  subtle ordering/tie-breaking bug could slip through silently — so the extra reasoning depth
  is worth it.
- **U27** *(done — delegated to Opus 5)* — genuinely open-ended design-direction decisions
  (background consistency) with no single right answer; the user chose to delegate this one to
  an Opus 5 subagent rather than decide on Sonnet, which surfaced a richer tradeoff analysis
  (image quality issues, an arbitrary original mapping) than a quick mechanical fix would have
  found — see its entry in the Usability section. (C5's font-awesome swap turned out small
  enough to not need this after all — see its entry in the Client section — but the larger
  styling-consolidation question it was originally paired with would still be a good Opus
  candidate if picked up later.)

You don't need a whole new session to switch — either change your active model before starting
that specific file/item, or ask for that one item to be delegated to a subagent with a model
override (e.g. "have an Opus agent do the B4 rewrite").

## Suggested execution order

| Phase | Focus | Items |
|---|---|---|
| 7 | Responsive design | U14, U13, U7, U15, U16, U25, U21 |
| 8 | Navigation/IA & forms polish | U2, U24, U3, U4, U5, U6, U17, U18, C10, U19, U20, U23 |

Phases 1-4 (server/DB/Python) touch systems only you can access (Aiven, credentials) or
review for correctness risk (SQL rewrites) — do those first regardless of client/usability
work. Phases 5-8 (client) can proceed independently and in any order relative to 1-4.

---

## Server (`server/index.js`, `db.js`)

- **S11** *(Phase 1, done — decision: Gmail SMTP App Password, chosen over a transactional
  email API)* — `server/index.js`'s `nodemailer.createTransport({...})` now points at
  `smtp.gmail.com:465` (`secure: true`) instead of the dead `mail.musichistoreum.com`, and the
  outgoing `mail.from` was changed from a bare display name to `` `"${name}" <${MAIL_USER}>` ``
  — Gmail's relay requires the From address to match the authenticated account/alias, which the
  old transport didn't need. `MAIL_USER`/`MAIL_PASSWORD` set to a real Gmail address and App
  Password in both `server/.env` and Vercel, deployed, and confirmed via a real `POST /contact`
  against production that delivered to the inbox.
- **S1** *(Phase 1, done)* — `POST /contact` now has its own `express-rate-limit` instance
  (`contactFormLimiter`, 5 requests/hour/IP, same JSON 429 handler style as D1's dev-token
  limiter, no shared-secret bypass).
- **S4** *(Phase 1, done)* — The raw-payload `logger.info(req.body)` call in the `/contact`
  handler was removed entirely (no replacement logging added — nothing non-PII was judged worth
  keeping).
- **S2** *(Phase 2, done)* — The remaining public read routes (`/chartList`,
  `/artist/list/:start_char`, `/artist/:dartist/:dtype`, `/chart/:cid/:ctype/:ctf/:cdate`,
  `/annual-top-songs`) each now carry a shared `publicReadLimiter` instance (100 req/15min/IP)
  applied per-route rather than via a single `app.use()`, since those five paths don't share a
  common prefix that `app.use()` could target cleanly — same net effect, same `rateLimit()`
  shape as S1/D1. Verified via `RateLimit-*` response headers on a local run.
- **S3** *(Phase 2, done)* — `statement_timeout: 10000` added to the `Pool` config in
  `server/db.js`.
- **S5** *(Phase 2, done)* — `helmet` installed in `server/` and `app.use(helmet())` added
  ahead of the other middleware. Verified locally: `Content-Security-Policy`,
  `Strict-Transport-Security`, `X-Content-Type-Options`, and `X-Frame-Options` all present on
  responses.
- **S6** *(Phase 2, done)* — `get_weekly_${chartType}_chart`/`get_range_${chartType}_chart`
  string interpolation replaced with explicit `WEEKLY_CHART_FUNCTIONS`/`RANGE_CHART_FUNCTIONS`
  lookup objects keyed by `Song`/`Album`, looked up before use in the
  `/chart/:cid/:ctype/:ctf/:cdate` route. Verified both Song and Album weekly/range lookups
  still return correct data.
- **S7** *(Phase 2, done)* — `winston.format.splat()` added into the logger's `combine(...)`
  chain.
- **S8** *(Phase 2, done)* — `.gitignore` entry widened from `server/mh_server.log` to
  `server/*.log` (confirmed no other tracked log files were affected).
- **S9** *(Phase 2, done)* — `/artist/:dartist/:dtype` now explicitly checks
  `dtype === 'songs' || dtype === 'albums'`, `422` otherwise. Verified: invalid `dtype` → 422,
  valid → 200.
- **S10** *(Phase 2, done)* — `/chart/.../:cdate` now validates strictly via
  `dayjs(chartDate, 'YYYY-MM-DD', true).isValid()` (using dayjs's bundled `customParseFormat`
  plugin, newly extended in `server/index.js`) before proceeding, `422` on failure. Verified:
  malformed/non-existent dates → 422, valid dates → 200.

## Database (`db/functions/*.sql`, `db/tables/*.sql`)

- **B1** *(Phase 3, done)* — `idx_chart_dates_chart_id_date` on `chart_dates(chart_id,
  chart_date)` applied to both local and Aiven; `db/tables/chart_dates.sql` regenerated.
  Verified via `EXPLAIN ANALYZE`: ~297ms Parallel Seq Scan → ~0.2ms Index Scan.
- **B6** *(Phase 3, done)* — `idx_chart_entries_chart_id_source` on `chart_entries(chart_id,
  source_id)` (a covering index, not just `chart_id` alone), applied alongside B1 to both
  databases. This index is ~107MB (`chart_entries` has ~4.85M rows) — combined with B1, it
  exhausted Aiven's storage quota mid-session and required a plan upgrade (see CLAUDE.md's
  "Database schema tracking" section) before B5 below could proceed. Existing
  `chart_entries_unique_row UNIQUE(source_id, chart_id)` constraint left untouched.
- **B5** *(Phase 3, done)* — `pg_trgm` confirmed available and enabled on both local and Aiven;
  GIN trigram index `idx_artist_list_artist_name_trgm` added on `artist_list.artist_name`.
  Verified via `EXPLAIN ANALYZE`: Seq Scan → Bitmap Index Scan for the existing
  `LIKE`/`similar to` filters, no query changes needed. Also addresses the CLAUDE.md-documented
  known issue that artist search is "plain text matching."
- **B3 / B4** *(Phase 3, done — delegated to an Opus 5 subagent)* — `peak_weeks` in
  `get_albums_by_artist.sql`/`get_songs_by_artist.sql` (B3) and the full cursor-loop
  point-scoring logic in `get_range_album_chart.sql`/`get_range_song_chart.sql` (B4) rewritten
  as set-based window-function queries and deployed to Aiven. Verification: 646 test cases /
  138,747 rows total, zero value differences vs. the originals, plus 5 deliberately-planted
  "plausible wrong rewrite" mutants that the verification suite correctly caught — worth
  trusting this one. Incidentally 2.2–4.9x faster. See `docs/site-hardening-audit.md`'s B3/B4
  entries for the two things this surfaced: the `pointFactor` integer-rounding quirk (now
  tracked as **B10**, a deferred decision) and one deliberate behavior change (a stable
  `song_id`/`album_id` tie-breaker added to the rank ordering, since the original's tie order
  wasn't actually stable/well-defined).
- **B10** *(Phase 3, new, decision — deferred, not urgent)* — See the audit doc for the full
  writeup and exact repro steps. Short version: build a temporary version of
  `get_range_song_chart`/`get_range_album_chart` with `point_factor` as `numeric` using the
  real 1/0.6/0.4 weights (thresholds differ between songs and albums - see audit entry), run it
  against the same chart/date-range as production, and diff `points`/rank output. User wants to
  see that comparison before deciding whether to actually change production behavior.
- **B8** *(Phase 3, done)* — Only `get_artist_list.sql` still had the
  `CREATE TEMP TABLE ... ON COMMIT DROP` pattern by the time this was picked up (B3/B4's
  rewrite already removed it from the other four functions as a side effect). Rewrote as a
  single `WITH artist_table AS (... UNION ...) SELECT ...` CTE. Verified: 9 test cases covering
  every branch of the function's `starting_char` logic (`!`, digit, upper/lowercase letter,
  `*`, space, `0`) matched old-vs-new byte-for-byte, both locally and confirmed live in
  production.
- **B2** *(Phase 3, done — decision: leave as-is, add detection)* — Added
  `db/queries/orphan_row_audit.sql`, covering all five implicit parent/child relationships in
  the schema (including the non-obvious `chart_entries.chart_id` → `chart_dates.chart_date_id`
  mapping and the chart-type-dependent `chart_entries.source_id` split between `song_list`/
  `album_list`). Run against Aiven and confirmed zero orphans currently. No FK constraints
  added — `bb_scrape.py`'s insert flow still assumes friction-free inserts.
- **B7 / B9** *(Phase 3, done — decision: drop, not fix/rename)* — `usp_SEL_ChartEntriesByChart`
  dropped from both the local and Aiven databases (`DROP PROCEDURE`), and
  `db/functions/usp_SEL_ChartEntriesByChart.sql` deleted. B9 (the rename option) is moot since
  the procedure no longer exists.

## Python ingestion (`bb_script/`)

- **P8** *(Phase 1, done)* — The quote-stripping `load_env` (the one from
  `annual_top_songs.py`) is now in a shared `bb_script/env_utils.py`, imported by
  `sync_to_aiven.py` and `annual_top_songs.py` in place of their separate copies.
- **P1** *(Phase 1, done — including the password rotation)* — `bb_scrape.py` no longer
  hardcodes `DB_CONN_STRING`; it now reads `SOURCE_SERVICE_URI` from `bb_script/.env` via the
  shared `env_utils.load_env` helper (**P8** above) — no new env var was needed since
  `bb_script/.env` already had this exact connection string for `sync_to_aiven.py`. The
  committed password has also been rotated on both the local Postgres instance (via `ALTER
  USER`) and Aiven (via the Aiven console's password reset, not raw SQL, since Aiven manages
  that credential centrally) — both verified working, and production re-confirmed live against
  the server's real Vercel deployment after the required redeploy.
- **P2** *(Phase 4, done)* — The per-chart-entry insert block (`getArtistId`/`insertSong`/
  `insertAlbum`/`insertChartEntry`) is now wrapped in try/except, log-and-continue (plus
  rollback + reconnect) on a `psycopg2.Error`, matching the empty-week retry logic's tolerance
  philosophy. Verified via a real `BB_SCRAPE_ONLY`-scoped run against two real historical weeks
  on the local database.
- **P3 / P9** *(Phase 4, done)* — All **17** `conn.cursor()` call sites (the original count of
  13 didn't hold up under a direct recount) now use `with conn.cursor() as cur:`, and
  `retrieveChartIds`'s file handle uses `with open(...) as f:` too. Verified via the same real
  scoped test run — every cursor site got exercised for real (including the duplicate-conflict
  path) with no `InterfaceError`, and the chart's resume state ended up back exactly where it
  started.
- **P4** *(Phase 4, done)* — `SCRAPE_DELAY_SECONDS = 10` added near the top of `bb_scrape.py`,
  replacing all three `time.sleep(10)` call sites.
- **P6** *(Phase 4, done — scope corrected)* — Only `sync_to_aiven.py` actually interpolates
  table/column names into SQL via f-strings; `migrate_chart_entries.py`/`annual_top_songs.py`
  only use f-strings for log messages (verified directly, contrary to the original finding's
  broader claim). Added `KNOWN_TABLES`/`KNOWN_COLUMNS` allow-lists and an
  `_assert_known_identifiers` check before every f-string-built query in `sync_to_aiven.py`.
  Verified: correctly raises on a SQL-injection-shaped table name and an unknown column name,
  and a real full sync run against Aiven completed normally with the guard in place.
- **P7** *(Phase 4, done)* — `weekly_update.bat`'s hardcoded `C:\Users\looko\...` replaced with
  `%USERPROFILE%`; added a 5MB size check that rotates the log to `.log.old` before a run
  starts if it's grown past that. Verified both branches (rotates when oversized, doesn't when
  small) with a throwaway test harness.
- **P5** *(Phase 4, done)* — Added a module docstring and per-function docstrings to
  `bb_scrape.py`. `logging.basicConfig` now logs to both the file and console, which let the
  one genuinely duplicate `print()`/`logging.info()` pair (identical message) collapse into a
  single logging call — the other print/logging pairs in the file were left alone since their
  messages actually differ in content (terse console vs. detailed file record), so consolidating
  them would have lost information rather than just deduplicating it.

## Client (`client/src/**`)

- **C2** *(Phase 5, done)* — `window.onbeforeunload` in `ChartCard.js` now set inside a
  `useEffect` keyed on `[chartType, chartId, chartTimeframe, chartDate]`, cleared on cleanup.
- **C3** *(Phase 5, done)* — The `cancelled`-flag pattern from `AnnualTopSongsList.js` added to
  `ChartCard.js`'s and `ArtistCard.js`'s fetch `useEffect`s.
- **C8** *(Phase 5, done)* — `key` prop in `TopArtistList.js` moved from the inner `<Link>` to
  the `<li>`.
- **C9** *(Phase 5, done)* — `console.warn` calls in `songMatcher.js`/`chartsSlice.js` gated
  behind `process.env.NODE_ENV !== 'production'` rather than removed, since they're useful
  during development.
- **C1** *(Phase 5, done)* — Added an in-memory `Map` cache in `songMatcher.js`, keyed by
  normalized `title+artist`, checked before each catalog search; persists across calls for the
  page's lifetime. Stores the unmatch reason alongside the match id, not just the id, per the
  note above about U20.
- **C7** *(Phase 5, done)* — `CreatePlaylistModal.js` now maps known error cases (the app's own
  already-friendly messages, network-shaped failures) to friendly text via
  `getFriendlyErrorMessage()`, falling back to a generic message instead of raw `err.message`.
- **C4** *(Phase 5, done)* — The 6 actually-referenced background JPEGs resized to a 1920px max
  dimension and re-compressed (quality 78, progressive): 7.85MB → 1.28MB combined, spot-checked
  visually. `main_banner_old.jpg` deleted after confirming zero references.
- **C5** *(Phase 5, done — decision: swap font-awesome now, defer the bigger question)* —
  Font-awesome's real footprint was only 5 icons across 4 files. Replaced with a small
  `components/Icon.js` (inline SVGs, Material Design Icons paths under Apache-2.0) — net
  dependency count unchanged (one added, one removed), CSS bundle ~6.9KB smaller gzipped,
  confirmed via a real build that no font-awesome assets remain in the output. The
  bootstrap/reactstrap/styled-components consolidation question is explicitly **not** decided
  here — deferred to a future, separate discussion.
- **C6** *(Phase 5, done — decision: keep committed)* — Added a comment to both
  `.env.production`/`.env.development` plus a `CLAUDE.md` note: never put a secret in either
  file, since anything there ends up in the public client bundle regardless of git status.
- **C11** *(Phase 5, done — decision: leave as-is)* — Correction: the Saturday/Monday pre-1962
  chart-day question actually lives in `CLAUDE.md`, not `KnownIssuesPage.js` (verified that page
  doesn't mention it). Since it's a real open research question, not a mechanical fix, the
  commented-out `FirstDate` values in `SONG_CHARTS.js` are left in place as a placeholder.

## Usability

- **U8** *(Phase 6, done)* — Correction found during implementation: react-datepicker does not
  actually forward an arbitrary `aria-label` prop to its input (verified against the installed
  package — only `ariaLabelledBy`/`ariaDescribedBy`/`ariaInvalid`/`ariaRequired` are forwarded).
  Used the plan's other suggested approach instead: a visually-hidden `<label htmlFor>` + matching
  `id` added to all four picker components (`WeekPicker.js`, `MonthPicker.js`, `YearPicker.js`,
  `DecadePicker.js`).
- **U1** *(Phase 6, done)* — Added a `.artist-link-cell` CSS class (light lavender, underlined,
  brightens on hover/focus) to the `artist_name` cell in `Table.js`.
- **U9** *(Phase 6, done)* — `Header.js`'s site title kept as the only real `<h1>`; every page's
  own page-title heading changed to `<h2>` (`HomePage.js` ×2, `AboutPage.js`, `FeaturesPage.js`,
  `KnownIssues.js`, `ArtistList.js`, `ArtistCard.js`, `ChartCard.js`, `AnnualTopSongsList.js`).
  No visual change, since `App.css` already styles `h1`/`h2`/`h3` identically.
- **U10** *(Phase 6, done)* — Added `role="status" aria-live="polite"` to `CreatePlaylistModal.js`'s
  in-progress status paragraph, and `role="alert" aria-live="assertive"` to its error paragraph
  and the contact form's submit-error paragraph.
- **U11** *(Phase 6, done)* — Replaced each `<NavLink to='#'>` letter filter in `AlphabetNav.js`
  with a real `<button type="button" className="nav-link alphaItem">`, with a small CSS reset
  (`border: none; background: none;`) to keep the visual appearance unchanged.
- **U12** *(Phase 6, done)* — Measured contrast precisely (WCAG relative-luminance formula)
  instead of eyeballing, and found the plan's guess understated the problem: `#7b68ee` bottom-nav
  hover text on `#483d8b` measured only 2.18:1 (needs 4.5:1), far worse than expected — replaced
  with `#c9c2f7` (5.42:1). The `#888` gray on white measured 3.54:1 — replaced with `#767676`
  (4.54:1, the standard "darkest AA-safe gray on white"). The site-title text (`#4a4a4a` on
  `#c3bee5`) measured 4.99:1 and needed no change.
- **U22** *(Phase 6, done)* — `AppleMusicPlaylistToolbar.js`'s wrapping `<div>` now has a
  `rgba(255, 255, 255, 0.85)` background plus padding/border-radius, fixing the washed-out
  `outline`-button contrast. The custom-count input widened from 70px to 90px, fixing the
  truncated "Custo" placeholder.
- **U27** *(Phase 6, done — decision, delegated to an Opus 5 subagent per the user's explicit
  choice)* — Chose option (c), a small reused set grouped by section: the original per-page
  photo mapping was arbitrary (genre photos on pages with no genre connection), and two of the
  six original images had real quality problems under the dimming overlay
  (`vinyl-1894855_960_720.jpg` only 960×720, visibly soft full-viewport; `country.jpg`'s light
  upper region reading mid-grey at `brightness(50%)`). No images deleted — the newly-unreferenced
  ones stay on disk (zero other references confirmed via grep) as future candidates.
- **U26** *(Phase 6, done)* — Implemented as part of U27's rewrite: `AnnualTopSongsPage` now
  shares `vinyl-1595847.jpg` with the other data/chart pages in `App.css`, closing the missing-rule
  gap. Bundled image payload dropped from ~1.28MB to ~406KB as a side effect of the consolidation.
  Verified with a real production build (`npm run build`, no new warnings).
- **U14** *(Phase 7, do first in this phase)* — Add reactstrap's `NavbarToggler` + `Collapse`
  (with local `isOpen` state) to both `<Navbar>`s in `Header.js` — standard reactstrap
  collapsible-navbar pattern, no new dependency needed.
- **U13** *(Phase 7)* — Add real `@media` breakpoints (e.g. `768px`) starting with `Header.css`,
  `App.css`, and the chart/artist table styles. Where JS currently branches on
  `window.innerWidth` once at mount (`ChartCard.js`, `ChartPage.js`), prefer moving that logic
  into CSS (e.g. hide columns via a class + media query instead of excluding them in JS); if it
  has to stay in JS, add a `resize` listener with cleanup so it reacts to rotation/resize.
- **U7** *(Phase 7, sequence after U13)* — `ChartPage.js`'s `window.onresize` re-navigation to
  `/Chart` was likely a workaround for the exact problem U13 fixes properly — re-evaluate once
  U13 lands; if still needed, make it preserve current filter/pagination state before
  navigating instead of discarding it.
- **U15** *(Phase 7)* — Wrap `Table.js`'s `<table>` in a `<div style={{overflowX: 'auto'}}>` (or
  equivalent CSS class) so wide tables scroll horizontally on narrow viewports.
- **U16** *(Phase 7)* — Add a narrow-viewport `@media` override in `AnnualTopSongsList.css` that
  switches the fixed-width grid columns to a flexible layout (`minmax()`/`fr` units, or stacking
  the appearance sub-grid vertically below a breakpoint).
- **U25** *(Phase 7)* — In `Table.js`, remove `usePagination` and the "Show 10/20/30/40/50"
  page-size dropdown + page-flip button row; render the full fetched row set directly instead
  of the paginated `page` slice react-table currently exposes. Keep `useFilters`/
  `useGlobalFilter` as-is — they already operate on the full dataset regardless of pagination.
  Verify the largest realistic case (a full Decade range chart) still renders smoothly with no
  page-size ceiling, and confirm nothing else (e.g. `ChartCard.js`'s `hiddenColumns` logic)
  depends on `pageIndex`/`pageSize` state being present. Sequenced here, before **U21**, since
  it removes the pagination buttons U21 would otherwise resize.
- **U21** *(Phase 7, skip if U25 above is implemented)* — Increase `Table.js`'s pagination
  button `min-width`/`min-height`/padding to roughly 44×44px (standard minimum touch target),
  especially for mobile. This becomes moot once U25 lands, since there are no pagination
  buttons left to size — only do this one if U25 is deferred or rejected.
- **U2** *(Phase 8)* — Add brief helper text above `ChartMenu.js`'s accordion (e.g. "Pick a
  chart type, then a specific chart, then a timeframe") — copy-only change, no structural work.
- **U24** *(Phase 8, quick win)* — Don't just append `#bottomNavItems2b` to `Header.css`'s
  existing ID selector list (same fragility next time a nav item is added or reordered).
  Instead, add a shared class (e.g. `bottomNavItem`) to all five `NavLink`s in `Header.js`, and
  update `Header.css` to target `.bottomNavItem`/`.bottomNavItem:hover` in place of the five
  hardcoded `#bottomNavItemsN` selectors — fixes the immediate inconsistency and removes the
  pattern that caused it.
- **U3** *(Phase 8, decision)* — Replace the `/Artist/ABCXYZ` sentinel with a real dedicated
  route (e.g. `/Artists`), updating `ArtistPage.js`/`ArtistCard.js` to key off the route instead
  of a magic string. If a full route change is out of scope right now, at minimum extract
  `ABCXYZ` into a named, documented constant shared between `Header.js` and `ArtistPage.js`.
- **U4** *(Phase 8, decision)* — Add a small breadcrumb or "Back to chart" link when arriving at
  an artist page from a chart click. Needs a design decision first: how to carry the originating
  chart context through navigation (e.g. React Router route state) since today's navigation
  doesn't retain it at all — scope this as its own small design pass before implementing.
- **U5** *(Phase 8)* — Add a `NavItem`/`NavLink` to `/Issues` in `Header.js`, matching the
  existing nav item pattern.
- **U6** *(Phase 8, decision)* — Either enable `bFilter` on the homepage's chart preview table,
  or add a one-line hint that filtering/search becomes available once a chart is open — decide
  how prominent to make it.
- **U17 / U18** *(Phase 8, sequence after S11)* — Tune Formik's `validateOnBlur`/
  `validateOnChange` in the contact form for earlier feedback than submit-only, add
  required-field indicators next to labels, disable the submit `<Button>` while
  `isSubmitting`, and show a brief success confirmation before closing the modal instead of
  closing silently. Lower priority until **S11** lands — polishing the submit experience of a
  form that always errors out isn't worth much yet.
- **C10** *(moved here from Phase 5 — must be done with U19 below)* — In `ArtistCard.js`,
  change `setSongItems(() => [{...}])`/`setAlbumItems(() => [{...}])` to
  `setSongItems([{...}])`/`setAlbumItems([{...}])` — plain arrays, not zero-arg functions.
  Behavior is unchanged (verified in the audit); this only removes the confusing indirection.
  Do this in the same edit as U19, since both touch the exact same lines.
- **U19** *(Phase 8)* — Replace `ArtistCard`'s fake `Chrono` timeline entry for "no results" with
  a plain conditional render (e.g. a `<p>No songs found for this artist.</p>` instead of feeding
  a fake item into `<Chrono items={songItems}>`). Pairs directly with **C10** above.
- **U20** *(Phase 8)* — Have `songMatcher.js` return a reason per unmatched song (e.g. "no
  catalog match found" vs. "ambiguous match, skipped") and display it alongside each title in
  `CreatePlaylistModal.js`'s post-run summary.
- **U23** *(Phase 8)* — Replace `AppleMusicPlaylistToolbar.js`'s `TOP_N_PRESETS` button row +
  separate custom `<input>` + `Apply` button with a single dropdown/select (`50 / 75 / 100 /
  All / Custom…`), revealing one inline number input only when "Custom…" is chosen. Cuts the
  row from five discrete controls down to one or two and removes the "which button vs. which
  box" ambiguity flagged directly from live-site review. Trade-off: a custom value now takes an
  extra click (open dropdown → Custom → type) instead of being always-visible — acceptable
  given how cramped the current row is. Sequence after **U22** (background fix) so the reworked
  control isn't styled against the same washed-out background.

## Verification

No single blanket test plan covers all of this — verify each phase the way its own area
already gets verified in this repo:

- **Server (Phases 1-2):** same manual `curl`/local-`node index.js` checks used for the
  dev-token rate limiter — confirm normal requests still succeed and the new limits/validation
  actually trip on bad/excess input.
- **Database (Phase 3):** run `EXPLAIN ANALYZE` on the relevant `get_*` functions before and
  after B1/B6 to confirm the planner picks up the new indexes; for B3/B4's rewrites, diff JSON
  output between old and new versions for several known artists/charts/date-ranges before
  considering them equivalent.
- **Python (Phase 4):** a short local dry run of `bb_scrape.py` against a test chart
  (`BB_SCRAPE_ONLY` env filter already supports this) to confirm cursors/exceptions behave as
  expected without waiting for a full multi-hour run.
- **Client/Usability (Phases 5-8):** `npm start` and click through the affected page(s) in a
  browser, including a narrow-viewport/mobile check for Phase 7 specifically (no browser
  automation was available when writing this plan, so this hasn't been visually confirmed yet).
