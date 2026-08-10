# Implementation Plan — Site Hardening & Usability Audit

Turns every item in `docs/site-hardening-audit.md` into a concrete implementation step.
Organized the same way as the audit (Server, Client, Python ingestion, Database, Usability),
with a suggested execution order up front. Item IDs (S1, C1, P1, B1, U1, ...) match the audit
doc exactly — cross-reference there for the original finding/severity/rationale; this doc is
just the "how."

`D1` (`/apple-music/developer-token` rate limiting) is already implemented and isn't repeated
here. `S1`, `S4`, `P8`, and `P1` (the rest of Phase 1 besides S11) have since been implemented
too and are no longer listed in the phase table below — see their entries in the Server/Python
detail sections for what changed. `S11` has been implemented in code (Gmail SMTP transport) but
isn't live yet — one manual credential-setup step remains; see its entry for exactly what.

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

**S11** (the contact form's mail transport is completely dead, not just unhardened) is the
highest-priority item in the whole plan for that reason — it's a fully broken user-facing
feature, not a hardening gap. **S1** and **U17/U18** both assume the form works at all, so
they're marked to sequence after S11 lands rather than being done on their own phase's normal
schedule.

## Model recommendations

Sonnet 5 (the default for this plan) is fine for the large majority of items — mechanical,
well-specified work (config additions, prop fixes, CSS rules, rate limiters, cursor/file-handle
wraps). Two categories are worth stepping up to Opus 5 for, flagged inline below as
**(consider Opus 5)**:

- **B3 / B4** — rewriting the artist `peak_weeks` and range-chart SQL functions from cursor
  loops to set-based window functions. This is the plan's highest-stakes correctness work — a
  subtle ordering/tie-breaking bug could slip through silently — so the extra reasoning depth
  is worth it.
- **C5 / U27** — genuinely open-ended design-direction decisions (styling consolidation,
  background consistency) with no single right answer. Opus tends to surface richer tradeoff
  analysis on these than a quick mechanical fix needs.

You don't need a whole new session to switch — either change your active model before starting
that specific file/item, or ask for that one item to be delegated to a subagent with a model
override (e.g. "have an Opus agent do the B4 rewrite").

## Suggested execution order

| Phase | Focus | Items |
|---|---|---|
| 1 | Security-critical — live/committed credentials, external abuse vectors, a dead feature | S11* (code done, needs credentials) |
| 2 | Server hardening & input validation | S2, S3, S5, S6, S7, S8, S9, S10 |
| 3 | Database integrity & performance | B1, B6, B5, B3, B4, B8, B2*, B7*, B9 |
| 4 | Python ingestion reliability | P2, P3, P9, P4, P6, P7, P5 |
| 5 | Client correctness & efficiency | C2, C3, C8, C9, C1, C7, C4, C6*, C5*, C11* |
| 6 | Accessibility & visual consistency | U1, U8, U9, U10, U11, U12, U22, U27*, U26 |
| 7 | Responsive design | U14, U13, U7, U15, U16, U25, U21 |
| 8 | Navigation/IA & forms polish | U2, U24, U3, U4, U5, U6, U17, U18, C10, U19, U20, U23 |

\* = decision point, see detail section.

Phases 1-4 (server/DB/Python) touch systems only you can access (Aiven, credentials) or
review for correctness risk (SQL rewrites) — do those first regardless of client/usability
work. Phases 5-8 (client) can proceed independently and in any order relative to 1-4.

---

## Server (`server/index.js`, `db.js`)

- **S11** *(Phase 1, done in code — decision: Gmail SMTP App Password, chosen over a
  transactional email API)* — `server/index.js`'s `nodemailer.createTransport({...})` now
  points at `smtp.gmail.com:465` (`secure: true`) instead of the dead
  `mail.musichistoreum.com`, and the outgoing `mail.from` was changed from a bare display name
  to `` `"${name}" <${MAIL_USER}>` `` — Gmail's relay requires the From address to match the
  authenticated account/alias, which the old transport didn't need. **Remaining manual step**:
  set `MAIL_USER` to a real Gmail (or Google Workspace) address you control and `MAIL_PASSWORD`
  to a Google Account App Password for it (Google Account → Security → 2-Step Verification →
  App passwords; requires 2-Step Verification to be enabled first) — in **both**
  `server/.env` (local) and Vercel's project environment variables (production). Confirm by
  restarting `server/index.js` locally and watching `contactEmail.verify()` log success instead
  of an `ESOCKET` timeout, then submit the contact form end-to-end.
- **S1** *(Phase 1, done)* — `POST /contact` now has its own `express-rate-limit` instance
  (`contactFormLimiter`, 5 requests/hour/IP, same JSON 429 handler style as D1's dev-token
  limiter, no shared-secret bypass). Still low-value until S11's credentials are live, but
  already in place.
- **S4** *(Phase 1, done)* — The raw-payload `logger.info(req.body)` call in the `/contact`
  handler was removed entirely (no replacement logging added — nothing non-PII was judged worth
  keeping).
- **S2** *(Phase 2)* — Rate-limit the remaining public read routes (`/chartList`,
  `/artist/list/:start_char`, `/artist/:dartist/:dtype`, `/chart/:cid/:ctype/:ctf/:cdate`,
  `/annual-top-songs`). One shared, more generous limiter (e.g. 100 req/15min/IP) applied via
  `app.use()` ahead of these routes, same `rateLimit()` shape as S1/D1.
- **S3** *(Phase 2)* — Add `statement_timeout` (e.g. `10000`) to the `Pool` config in
  `server/db.js`. Config-only change, no query changes needed.
- **S5** *(Phase 2)* — `npm install helmet` in `server/`, `app.use(helmet())` near the other
  middleware. This is a pure JSON API (no HTML served from Express), so helmet's defaults are
  safe as-is — no CSP tuning needed.
- **S6** *(Phase 2)* — Replace the `get_weekly_${chartType}_chart`/`get_range_${chartType}_chart`
  string interpolation with an explicit lookup object (e.g.
  `{ Song: 'get_weekly_song_chart', Album: 'get_weekly_album_chart' }`, same for the range
  variant), looked up before use in the `/chart/:cid/:ctype/:ctf/:cdate` route.
- **S7** *(Phase 2)* — Add `winston.format.splat()` into the `combine(...)` chain in the logger
  config — one-line fix that covers every existing multi-arg `logger.info('label', value)` call
  site at once. Spot-check a couple of call sites afterward to confirm they now log as intended.
- **S8** *(Phase 2)* — Change the `.gitignore` entry from `server/mh_server.log` to
  `server/*.log` (confirmed no other tracked log files would be affected).
- **S9** *(Phase 2)* — Validate `:dtype` in `/artist/:dartist/:dtype`: explicit
  `dtype === 'songs' || dtype === 'albums'` check, else `422`, matching the existing
  `chartType`/`chartTime` validation pattern already in the chart route.
- **S10** *(Phase 2)* — Validate `:cdate` with strict parsing (`dayjs(chartDate, 'YYYY-MM-DD',
  true).isValid()`) before proceeding; `422` on failure, consistent with the route's existing
  422 responses.

## Database (`db/functions/*.sql`, `db/tables/*.sql`)

- **B1** *(Phase 3, do first)* — `CREATE INDEX idx_chart_dates_chart_id_date ON chart_dates
  (chart_id, chart_date);` — matches the exact filter used by every `get_weekly_*`/`get_range_*`
  /`get_artist_list` function. Highest-leverage single change in this whole plan; every chart
  page load benefits. Apply on Aiven directly, then update the tracked `db/tables/chart_dates.sql`
  snapshot to match (per the existing tracked-snapshot convention).
- **B6** *(Phase 3)* — Add a supporting index, `CREATE INDEX idx_chart_entries_chart_id ON
  chart_entries (chart_id);` (or a covering `(chart_id, source_id)` index). Don't reorder the
  existing `chart_entries_unique_row UNIQUE(source_id, chart_id)` constraint — uniqueness is
  symmetric regardless of column order, so reordering it wouldn't change lookup performance;
  a separate index is the actual fix. Do this alongside B1 since both serve the same join path.
- **B5** *(Phase 3)* — Enable `pg_trgm` (`CREATE EXTENSION IF NOT EXISTS pg_trgm;` — confirm
  availability on Aiven first, the same way `pldbgapi`/`fuzzystrmatch` were checked during the
  original migration per `docs/aiven-migration-notes.md`), add a GIN trigram index on
  `artist_list.artist_name` (`USING gin (artist_name gin_trgm_ops)`), then the existing
  `LIKE`/`similar to` filters in `get_artist_list`/`get_albums_by_artist`/`get_songs_by_artist`
  can use it as-is (Postgres will pick the index for `LIKE '%...%'` once it exists). This also
  directly addresses the CLAUDE.md-documented known issue that artist search is "plain text
  matching."
- **B3** *(Phase 3, consider Opus 5)* — Rewrite `peak_weeks` in `get_albums_by_artist.sql`/
  `get_songs_by_artist.sql` as a window function (`COUNT(*) FILTER (...) OVER (PARTITION BY
  ...)`, or a pre-aggregated CTE joined once) instead of a per-row correlated subquery. Verify
  by comparing output for a handful of known artists against the current function before/after.
- **B4** *(Phase 3, largest single item in this plan, consider Opus 5)* — Rewrite `get_range_album_chart.sql`/
  `get_range_song_chart.sql` as set-based queries: replace the nested cursor loops with one
  query using window functions (`MIN`/`MAX`/`COUNT` over `PARTITION BY source_id`) to compute
  peak/points/weeks across the range in a single pass. Budget real time for this one — verify
  output against the current cursor-based version across several chart/date-range combinations,
  since ordering/tie-breaking differences are easy to introduce silently.
- **B8** *(Phase 3)* — Replace `CREATE TEMP TABLE ... ON COMMIT DROP` + populate + `SELECT *`
  with a single `WITH ... AS (...) SELECT ...` CTE in each of the six JSON-returning functions.
  Mechanical, low-risk — done here, right after B3/B4, since you're already editing these files.
- **B2** *(Phase 3, decision)* — No FK constraints anywhere is a deliberate tradeoff already
  documented in `docs/aiven-migration-notes.md` (app does lookup-or-insert, not DB-enforced
  relations). Recommend **not** adding enforced FKs blindly, since `bb_scrape.py`'s insert flow
  assumes no FK friction. Decide between: (a) leave as-is, add a periodic orphan-row audit
  query instead, or (b) add FKs only after confirming `bb_scrape.py`'s insert order can never
  violate them. Needs your call, not a mechanical fix.
- **B7** *(Phase 3, decision)* — `usp_SEL_ChartEntriesByChart` is unreachable and broken against
  the current schema. Recommend dropping it (`DROP FUNCTION ...` on the DB, delete
  `db/functions/usp_SEL_ChartEntriesByChart.sql`) rather than fixing something nothing calls —
  confirm before deleting, since it's a live DB object.
- **B9** *(Phase 3)* — Moot if B7 is chosen (deletion). Otherwise, rename to
  `get_chart_entries_by_chart` for naming consistency with the rest of the `get_*` functions.

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
- **P2** *(Phase 4)* — Wrap the per-chart-entry insert block (`getArtistId`/`insertSong`/
  `insertAlbum`/`insertChartEntry`) in try/except, log-and-continue per item on failure, so one
  bad row or a transient DB error doesn't crash the whole scrape run — matches the tolerance
  philosophy already used for the empty-week retry logic.
- **P3** *(Phase 4)* — Wrap each of the 13 unclosed `conn.cursor()` call sites in
  `with conn.cursor() as cur:` (psycopg2 cursors support the context-manager protocol).
  Mechanical find-and-wrap, low risk.
- **P9** *(Phase 4)* — Same fix as P3, applied to `retrieveChartIds`'s file handle too: wrap the
  `open(...)` in `with open(...) as f:` and its cursor in `with conn.cursor() as cur:`.
- **P4** *(Phase 4)* — Introduce `SCRAPE_DELAY_SECONDS = 10` near the top of `bb_scrape.py`
  (alongside the existing `EMPTY_WEEK_RETRY_LIMIT` constant pattern) and replace the three
  `time.sleep(10)` call sites.
- **P6** *(Phase 4)* — Add a shared allow-list constant (e.g. `KNOWN_TABLES`) checked before any
  f-string SQL interpolation in `sync_to_aiven.py`/`migrate_chart_entries.py`/
  `annual_top_songs.py`, so a future change can't silently make a table/column name
  attacker-influenced without tripping an assertion first.
- **P7** *(Phase 4)* — Switch `weekly_update.bat`'s log from unbounded `>>` append to a rotation
  scheme (simplest: have the batch file rename/trim the log past a size threshold before
  appending). Also replace the hardcoded `C:\Users\looko\...` path with `%USERPROFILE%` so the
  script isn't tied to one specific machine/user.
- **P5** *(Phase 4, ongoing/opportunistic)* — Add docstrings to the main functions, replace
  redundant `print()` + `logging.info()` pairs with just the logger call. Lower priority — fine
  to do incrementally alongside other `bb_scrape.py` edits rather than as its own pass.

## Client (`client/src/**`)

- **C2** *(Phase 5)* — Move the `window.onbeforeunload` assignment in `ChartCard.js` into a
  `useEffect(() => { window.onbeforeunload = ...; return () => { window.onbeforeunload = null;
  }; }, [chartType, chartId, chartTimeframe, chartDate])` so it's set once per relevant change
  and cleaned up on unmount, not re-registered every render.
- **C3** *(Phase 5)* — Copy the `cancelled`-flag pattern already used correctly in
  `AnnualTopSongsList.js` into `ChartCard.js`'s and `ArtistCard.js`'s fetch `useEffect`s
  (`let cancelled = false; ...; if (!cancelled) setData(...); return () => { cancelled = true;
  };`).
- **C8** *(Phase 5)* — Move the `key` prop in `TopArtistList.js` from the inner `<Link>` to the
  `<li>` returned by `.map()`.
- **C9** *(Phase 5)* — Remove the stray `console.warn` calls in `songMatcher.js`/
  `chartsSlice.js`, or gate them behind `if (process.env.NODE_ENV !== 'production')` if they're
  useful during development.
- **C1** *(Phase 5)* — In `songMatcher.js`, add an in-memory cache keyed by normalized
  `title+artist` so duplicate songs (common across years/charts on the Annual Top Songs page)
  only trigger one catalog search; keep the existing concurrency-5 batching, just skip
  already-resolved keys. Sequenced right after **C9** since both edit `songMatcher.js`. If
  **U20** (Phase 8) is also planned, worth designing this cache to store the match/no-match
  reason per key too, not just the matched result — otherwise U20's per-song reason only
  reflects the first occurrence and silently goes stale for deduped lookups.
- **C7** *(Phase 5)* — In `CreatePlaylistModal.js`, map known MusicKit/Apple error cases to a
  friendly message and fall back to a generic "Something went wrong talking to Apple Music"
  instead of showing `err.message` verbatim.
- **C4** *(Phase 5)* — Compress the JPEGs in `client/src/app/assets/img/` (re-export at
  reasonable quality/dimensions for their actual rendered size); delete `main_banner_old.jpg`
  once confirmed unreferenced.
- **C6** *(Phase 5, decision)* — `.env.production`/`.env.development` currently hold only a
  public API base URL. Recommend leaving them committed (simpler with CRA's build-time env
  model) but documenting explicitly that no secret may ever go in these files — vs. the
  alternative of gitignoring them and documenting the values elsewhere. Your call.
- **C5** *(Phase 5, decision, consider Opus 5)* — Three overlapping styling systems (bootstrap + reactstrap +
  styled-components) plus unmaintained `font-awesome@4.7.0`. Not a quick fix — recommend
  picking one long-term system and migrating incrementally rather than in one PR. First step
  regardless of direction: `grep -r "fa fa-" client/src` to inventory font-awesome usage before
  deciding what replaces it.
- **C11** *(Phase 5, decision)* — `SONG_CHARTS.js`'s commented-out pre-1962 `FirstDate` values
  are tied to the unresolved Saturday/Monday chart-day question in `KnownIssues.js`. Decide
  whether to resolve that question now and uncomment the real dates, or delete the dead comment
  if there's no near-term plan to resolve it.

## Usability

- **U8** *(Phase 6)* — Add a visually-hidden `<label htmlFor>` (Bootstrap's `visually-hidden`
  class) or at minimum an `aria-label="Select a chart date"` (react-datepicker forwards extra
  props to its input) to all four picker components: `WeekPicker.js`, `MonthPicker.js`,
  `YearPicker.js`, `DecadePicker.js`.
- **U1** *(Phase 6)* — Add a CSS treatment (underline on hover, distinct link color, or a small
  icon) to the `artist_name` cell in `Table.js` so it visually reads as interactive, not just
  `cursor:pointer`.
- **U9** *(Phase 6)* — Keep `Header.js`'s site title as the page's only real `<h1>`; change each
  page's own "page title" heading (`HomePage.js`, `AboutPage.js`, `ArtistCard.js`,
  `ChartCard.js`, `ArtistList.js`, etc.) to `<h2>`, keeping existing CSS classes/ids so visual
  styling doesn't need to change — semantic tag only.
- **U10** *(Phase 6)* — Add `aria-live="polite"` (or `role="status"`) to the status
  paragraph(s) in `CreatePlaylistModal.js` and the contact form's error message container.
- **U11** *(Phase 6)* — Replace each `<NavLink to='#' onClick={...}>` letter filter in
  `AlphabetNav.js` with a real `<button type="button" className="nav-link alphaItem"
  onClick={...}>`, keeping existing classes for styling — removes the semantic mismatch and the
  `href="#"` scroll-jump in one change.
- **U12** *(Phase 6)* — Check `#7b68ee`/`#c3bee5`/`#483d8b` and `#888`-on-white combinations with
  a contrast checker (e.g. WebAIM's) and darken whichever fails AA (4.5:1 for normal text) —
  likely just the `#888` gray needs adjustment.
- **U22** *(Phase 6)* — Give `AppleMusicPlaylistToolbar.js`'s wrapping `<div>` an opaque or
  semi-opaque background (e.g. wrap it in a reactstrap `Card`/`CardBody`, or just a background
  color on the existing div) so it no longer sits directly on the page's photo background — this
  alone fixes the washed-out `outline`-button contrast. Same pass: fix the custom-count input's
  hardcoded `style={{ width: '70px' }}` (confirmed too narrow for its "Custom" placeholder,
  visibly truncated to "Custo") — widen it or shorten the placeholder to something like "#".
- **U27** *(Phase 6, decision, consider Opus 5 — resolve before U26 below, which depends on
  this)* — Evaluate the overall page-background design direction. Currently each page gets a
  different themed photo (`vinyl-1595847.jpg`, `vinyl-1894855_960_720.jpg`, `concert-316464.jpg`,
  `rock.jpg`, `pop.jpg`, `country.jpg`) dimmed 50% via the shared `.mh-background::before`
  overlay, wired per-page through the `data-urltype` attribute + a matching `App.css` selector.
  Decide between: (a) keep one themed photo per page, but make sure every page participates
  (including U26) and add new pages to this list as a standing checklist item going forward,
  (b) consolidate to a single shared background/treatment across all pages for a more unified
  look, or (c) a middle ground — a small, deliberately-reused set of background treatments
  grouped by section rather than one image per page. No architecture change is needed for any
  of these — the `data-urltype` mechanism already supports whichever direction is chosen; this
  is purely a decision on what to actually use it for.
- **U26** *(Phase 6, quick win)* — Add a
  `[data-urltype='AnnualTopSongsPage']::before { background-image: url(...); }` rule to
  `App.css`, matching the pattern every other page already uses (`ChartPage`, `HomePage`,
  `ArtistPage`, `FeaturesPage`, `AboutPage`, `KnownIssuesPage`) — using whatever direction came
  out of **U27** above. If U27 hasn't been resolved yet, reuse an existing image (e.g. the same
  one as `HomePage`) rather than blocking this fix on the bigger decision.
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
