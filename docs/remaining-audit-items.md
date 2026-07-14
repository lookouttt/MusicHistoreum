# Remaining Audit Items

Tracks what's left from the original repository audit (`repository-audit.pdf`) after the priority-ordered fix pass. Everything not listed here (SQL injection, silent failures, contact validation, dead code, accessibility, CORS, DB pool errors, console logging, stale data, dependency pruning, date-picker duplication, style consolidation, nodemailer CVEs) has been fixed and verified.

## Server (`server/index.js`, `db.js`, `.gitignore`)

1. `get_weekly_${chartType}_chart` / `get_range_${chartType}_chart` — function name is still built by string interpolation of `chartType`. Currently safe only because of the `'Song'`/`'Album'` guard earlier in the route; should be an allow-list lookup so a future refactor can't reopen it.
2. `/contact` route logs the raw payload (`logger.info(req.body)`) — name/email/message persisted in plaintext to `mh_server.log` indefinitely, no redaction.
3. Winston's `logger.info('label', value)` multi-arg calls likely silently drop the second argument — the format chain (`combine(timestamp(), json())`) has no `splat()`.
4. Root `.gitignore` only ignores the literal `server/mh_server.log`, not a `*.log` wildcard.

## Python (`bb_script/bb_scrape.py`)

5. Hardcoded Postgres password in `DB_CONN_STRING` — flagged at the very start of the audit, still unfixed in code.
6. `time.sleep(10)` repeated 3x as an unnamed magic number.
7. No docstrings/type hints; redundant `print(...)` + `logging...(...)` pairs throughout instead of relying on the logger alone.

## Client

8. `package.json` architectural overlap: three styling systems side-by-side (`bootstrap` + `reactstrap` + `styled-components`), `font-awesome` v4 alongside Bootstrap's own icons, and `react-table` v7 (pre-hooks API) — worth a deliberate look, not a quick fix.
9. `SONG_CHARTS.js` — true historical `FirstDate` values for pre-1962 charts left commented out rather than removed (tied to the known unresolved Saturday/Monday chart-day issue in `KnownIssues.js`).
