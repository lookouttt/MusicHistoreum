# Aiven Migration Notes

Notes from migrating the local `BillboardData` PostgreSQL database (Windows, PG 14.2) to an Aiven for PostgreSQL service (PG 17.10). The first attempt used [aiven-db-migrate](https://github.com/aiven/aiven-db-migrate) and was aborted after the data-copy stage kept failing on the large `chart_entries` table (see [`aiven-db-migrate` is not Windows-clean](#aiven-db-migrate-is-not-windows-clean--patches-applied) and [Real issues](#real-non-windows-specific-issues-hit-after-the-patches) below). The second attempt — plain `pg_dump`/`pg_restore` for schema and small tables, plus a custom chunked script for `chart_entries` — succeeded; see [Successful approach: plain dump/restore + chunked script](#successful-approach-plain-dumprestore--chunked-script). There's no ongoing replication set up (deliberately — see #11), so [`sync_to_aiven.py`](#keeping-aiven-in-sync-later-sync_to_avienpy) exists for manually catching Aiven up whenever you want after running `bb_scrape.py` locally.

## Environment

- Source: local PostgreSQL 14.2 (Windows service `postgresql-x64-14`), database `BillboardData`, superuser `postgres`.
- Target: Aiven for PostgreSQL 17.10, database user `avnadmin` (not a true superuser — Aiven restricts this).
- `aiven-db-migrate` requires Python 3.12+; the system's default Python was 3.9, so a separate Python 3.14 venv was used (`bb_script/venv_aiven_migrate/`, gitignored).
- Norton 360 was ruled out as a factor for the Postgres-port (17858) connection specifically — a direct TLS handshake against the Aiven host showed the real Aiven certificate, not Norton's SSL-inspection certificate (see the separate Norton/OpenSSL 3.x note in memory, which *does* affect port-443 HTTPS traffic like PyPI and Billboard.com on this machine).

## `aiven-db-migrate` is not Windows-clean — patches applied

The upstream package (`pip install .` from a fresh `git clone`) needed several fixes to run at all on Windows. These were applied to the local clone at `bb_script/aiven-db-migrate/` (gitignored, not upstreamed):

1. **`make` unavailable.** The documented install (`make && pip install .`) assumes `make` is on PATH. It isn't on Windows/Git Bash. `make`'s only job here is writing `aiven_db_migrate/migrate/version.py` with `__version__ = "<git describe>"` — trivial to write by hand instead.
2. **`setup.py` encoding bug.** `long_description=open("README.md").read()` has no explicit encoding, so `pip install .` fails with `UnicodeDecodeError` on Windows (default `cp1252` codec can't decode a non-ASCII byte in the README). Fix: `open("README.md", encoding="utf-8")`.
3. **`select.poll()` doesn't exist on Windows.** `aiven_db_migrate/migrate/pgutils.py`'s `wait_select()` uses `select.poll()`, which is POSIX-only — CPython's `select` module simply has no `poll` attribute on Windows. Fails immediately with `AttributeError`. Fix: rewrite `wait_select()` using `select.select()` instead (available cross-platform for socket file descriptors; psycopg2 connections are always sockets, so this substitution is safe).
4. **`pg_dump`/`pg_restore` argument order.** `build_pg_dump_cmd`/`build_pg_restore_cmd` in `pgutils.py` place the positional connection-string argument *before* the `--flag` options (e.g. `pg_dump -Fc <conn_str> --verbose ...`). On Linux/Mac this works fine because GNU getopt permutes intermixed options and positionals. The Windows PostgreSQL 14 build's `pg_dump`/`pg_restore` do **not** permute — once a positional argument appears, every subsequent `--flag` is misparsed as an extra positional argument, and the tools error out (`pg_dump: error: too many command-line arguments (first is "--verbose")`). Fix: reorder both builder functions so all flags precede the connection string.
5. **Live pipe between `pg_dump` and `pg_restore` corrupts binary data on Windows.** `run_pg_dump_pg_restore()` in `pgutils.py` originally ran `pg_dump` and `pg_restore` concurrently, piping `pg_dump`'s stdout directly into `pg_restore`'s stdin via two chained `subprocess.Popen` calls. On Windows this reliably corrupted the binary custom-format dump stream — `pg_restore` would fail with `error: unsupported version (105.110) in file header` (a garbled header, consistent with bytes getting inserted/altered somewhere in the handle-passing). Fix: rewrote the function to dump to a temp file first, wait for `pg_dump` to fully exit successfully, then run `pg_restore` reading from that file. Slower and uses more disk than true streaming, but reliable. Temp file is cleaned up in a `finally` block.

With all five patches applied and the package reinstalled (`pip install . --force-reinstall --no-deps` in the venv), `pg_migrate --validate` and the schema-only stage of a real run both completed successfully.

## Real (non-Windows-specific) issues hit after the patches

These are genuine `aiven-db-migrate` / environment issues, not Windows quirks:

6. **Source DB extension not available on Aiven: `pldbgapi`.** The local `BillboardData` database has three extensions installed: `plpgsql` (core), `fuzzystrmatch` (available on Aiven, likely used by search — kept), and `pldbgapi` (PL/pgSQL Debugger API, bundled by the Windows PostgreSQL installer for pgAdmin's debugger — not available on Aiven's managed service, and not actually needed by the app). Validation fails on this until it's excluded: `pg_migrate ... -xe pldbgapi`.
7. **`aiven_extras` extension must be installed on the target first.** Since `avnadmin` isn't a real superuser, logical replication setup needs the `aiven_extras` extension present on the target database: `CREATE EXTENSION IF NOT EXISTS aiven_extras CASCADE;` (run once against the target's `defaultdb`, or whichever DB you connect to before the target DB exists).
8. **`wal_level` must be `logical` on the source for replication.** Default on a fresh Postgres install is `replica`. Changing it requires editing `postgresql.conf` (`wal_level = logical`) and **restarting the Postgres service** — this drops all active connections, including the Express server's pool. Needs admin/elevated privileges on Windows to restart a service (`Restart-Service` fails silently with an access-denied-flavored error from a non-elevated shell).
9. **Replication slot names are case-sensitive and the tool doesn't lowercase the DB name.** By default, `aiven-db-migrate` builds slot/publication/subscription names as `aiven_db_migrate_<dbname>_<slot|pub|sub>`, using the database name verbatim. Postgres replication slot names must be lowercase letters/digits/underscore only. `BillboardData` (mixed case) makes slot creation fail outright: `InvalidName: replication slot name "aiven_db_migrate_BillboardData_slot" contains invalid character`. **Fix: pass `-m`/`--mangle`**, which MD5-hashes the DB name into the generated identifiers instead of using it verbatim (also documented as solving identifier-length limits, but it solves the case issue too).
10. **Dump-restore of `CREATE DATABASE` fails cross-platform due to locale-name format differences.** When `pg_migrate` lets `pg_restore --create` create the target database itself, the embedded `CREATE DATABASE ... LOCALE = 'English_United States.1252'` statement (the Windows-style locale name of the source) is rejected by Aiven's Linux-based server (`invalid LC_COLLATE locale name`). Fix used: pre-create the target database manually with a Linux-valid locale matching the target server's default (checked via `SELECT datcollate, datctype FROM pg_database WHERE datname='defaultdb'` on the target — was `en_US.UTF-8`), then pass `--no-createdb` to `pg_migrate` so it doesn't try to replay the source's `CREATE DATABASE` statement.
11. **Ongoing (non-stopped) logical replication requires the target to open an inbound connection to the source.** This is the blocker that ended the attempt. `CREATE SUBSCRIPTION` on the Aiven side must connect *back* to the source using the connection string passed via `-s`. If that connection string says `host=localhost`, "localhost" resolves on **Aiven's** server, not the migration operator's machine — so it fails with `connection to server at "localhost" (127.0.0.1), port 5432 failed: Connection refused`. For this to work for real, the source Postgres needs to be reachable from Aiven's network: port-forwarding through the home router, a Windows Firewall inbound rule, and a `pg_hba.conf` entry scoped to Aiven's IP ranges over SSL. That's a real security-relevant infrastructure change (exposing a home database to the internet), not a config one-liner — deliberately not done as part of this attempt. If ongoing replication is wanted later, this is the prerequisite to actually solve.
12. **Large-table data copy (`chart_entries`: 4.85M rows, 423MB) reliably drops mid-transfer.** Both through `aiven-db-migrate`'s dump-fallback path and a manual `pg_restore --data-only` of just that one table, the single long-lived `COPY` to Aiven failed ~60-90 seconds in with `error returned by PQputCopyData: SSL connection has been closed unexpectedly`. Every other (smaller) table copied without issue. Tried and did **not** fix it: adding `keepalives`/`keepalives_idle`/`keepalives_interval` query params to the target connection string. Root cause not identified — ruled out Norton's SSL interception specifically for this port (verified the Aiven host presents its real certificate on port 17858, not Norton's inspection cert), but something in the path (router, ISP, Aiven-side connection handling, or an untested Norton firewall/IPS behavior beyond cert-swapping) resets long large binary transfers. Smaller tables (up to ~88k rows) were unaffected.

## Does Aiven support a server-side restore (upload a file, skip the network streaming)?

Checked Aiven's own docs directly: **no.** Their [pg_dump/pg_restore migration guide](https://aiven.io/docs/products/postgresql/howto/migrate-pg-dump-restore) only describes running `pg_restore` from the client machine, streaming data to the service over the network — there's no upload-a-dump-file-and-we-restore-it-server-side option, and no S3-style bulk import for standard PostgreSQL services (unlike some other providers, e.g. AWS RDS). Whatever machine runs `pg_restore` has to sustain the live connection to Aiven for the whole transfer. The `pg_dump` step itself was never the problem (dumping `chart_entries` to a local file took ~11 seconds, no issues) — it's specifically `pg_restore`'s network transfer to Aiven that drops on the large table.

## Options considered for the retry

Given #11 (ongoing replication needs inbound access to the source — a deliberate infrastructure decision, not made) and #12 (large single-`COPY` transfers over the current network path are unreliable), and confirmation that Aiven has no way to avoid streaming the restore over the network, these were the options on the table. **Option 1 is what was actually done** (see next section); the others are recorded in case option 1 ever needs backup.

1. **Chunk `chart_entries` in a resumable script**, plain `pg_dump`/`pg_restore` for everything else. ✅ Chosen — see below.
2. **Run the restore from a cloud VM instead of this machine.** A small, cheap VM (DigitalOcean/AWS/etc., ideally in a region close to the Aiven service) would have a more stable, higher-throughput path to Aiven than a home internet connection, and might sustain a full single-table `COPY` without dropping at all. Untested — turned out not to be necessary, since chunking alone fixed it.
3. **Combine both** — chunk the transfer *and* run it from a cloud VM. Not needed in the end.
4. **pgAdmin4's Backup/Restore GUI** as an alternative front-end for the schema + small tables (functionally equivalent to plain `pg_dump`/`pg_restore`). Not used, but would have worked equally well for those — it just would've hit the same `chart_entries` wall as everything else, since the underlying data-transfer mechanism is the same either way.

## Successful approach: plain dump/restore + chunked script

This is what actually worked, end to end, from this machine, with no new infrastructure (no cloud VM needed).

### Schema + 6 small/medium tables (`album_list`, `artist_list`, `chart_dates`, `chart_list`, `song_list`, `my_artist_id`)

1. Pre-create `BillboardData` on the target with a Linux-valid locale (per #10): `CREATE DATABASE "BillboardData" WITH TEMPLATE = template0 ENCODING = 'UTF8' LC_COLLATE = 'en_US.UTF-8' LC_CTYPE = 'en_US.UTF-8' OWNER = avnadmin;`
2. Dump schema only: `pg_dump -Fc --verbose --schema-only --no-owner -f schema.dump "<source_uri>"` — **do not** use `pg_dump`'s `-e`/`--extension` flag to try to exclude `pldbgapi`; it means "dump only these extensions" (a filter), not "make sure these are included." Using it accidentally produces a dump containing *only* the named extensions' objects, not the actual application schema. Learned this the hard way on the retry.
3. To actually exclude `pldbgapi` (#6) from a full schema dump, filter the table of contents instead: `pg_restore -l schema.dump > schema.list`, then comment out (prefix with `;`) the `EXTENSION - pldbgapi` and `COMMENT - EXTENSION pldbgapi` lines in `schema.list`.
4. Restore with the filtered list: `pg_restore --verbose --no-owner --use-list=schema.list -d "<target_uri>" schema.dump`. Expect exactly one ignorable error here: the source database may have a leftover `PUBLICATION ... FOR ALL TABLES` object from an earlier aborted `aiven-db-migrate` attempt (its own replication setup, never cleaned up) — restoring it needs superuser, which `avnadmin` doesn't have, and it's not needed for a plain data copy anyway. `pg_restore` reports it as one ignored error and continues; everything else restores fine. If reusing this doc's steps a third time, check first with `SELECT pubname FROM pg_publication;` / `SELECT slot_name FROM pg_replication_slots;` on the source and drop any leftovers so this error doesn't reappear.
5. Confirmed: this schema has **no foreign key constraints at all** — the app relies on lookup-or-insert application logic (see `bb_scrape.py`), not DB-enforced relations. So table load order for data doesn't matter for correctness.
6. Dump data for the six small/medium tables in one file: `pg_dump -Fc --verbose --data-only --no-owner -t album_list -t artist_list -t chart_dates -t chart_list -t song_list -t my_artist_id -f small_tables.dump "<source_uri>"`.
7. Restore it: `pg_restore --verbose --no-owner --data-only -d "<target_uri>" small_tables.dump`. Row counts matched source exactly for all six tables, no errors.

(Remember the arg-order gotcha from #4 in every one of the above commands: flags before the connection string.)

### `chart_entries` (the big one: 4.85M rows, 423MB)

Given #12, this can't be done as a single `pg_dump`/`pg_restore` pair — confirmed it fails identically whether driven by `aiven-db-migrate`, plain `pg_restore --data-only` on a single-table dump, or (untested but expected, same underlying mechanism) pgAdmin4's restore.

Wrote `bb_script/migrate_chart_entries.py`: a standalone Python/psycopg2 script that copies `chart_entries` in batches of 100,000 rows, **opening a fresh connection to the target for every batch** rather than holding one connection open for the whole transfer — this is the key design choice that sidesteps the drop regardless of its root cause (whatever resets a long-lived connection around 60-90s doesn't get the chance to, since no single connection lives that long). Also:

- Resumable: on startup, queries the target's current `MAX(entry_id)` and continues from there, so a killed/restarted run doesn't redo work.
- Idempotent: inserts use `ON CONFLICT (entry_id) DO NOTHING`, since explicit `entry_id` values are copied from the source (not regenerated), so re-running a batch that partially landed can't create duplicates.
- Retries each batch's fetch/insert up to 5 times with a delay before giving up.
- Syncs `chart_entries_entry_id_seq` on the target to the max copied `entry_id` once done.

Ran successfully in the background — all 4,855,668 rows copied in ~36 minutes with zero connection drops across ~49 batches. Verified afterward: `SELECT count(*), max(entry_id) FROM chart_entries` matches exactly between source and target (4,855,668 rows, same max `entry_id`).

**Migration complete.** `BillboardData` is now fully copied to Aiven — schema, all six small/medium tables, and `chart_entries`.

## Keeping Aiven in sync later: `sync_to_aiven.py`

There's no ongoing replication (deliberately — see #11), so `bb_script/sync_to_aiven.py` exists to manually bring the Aiven copy up to date on demand, any time after running `bb_scrape.py` locally. It generalizes the same fresh-connection-per-batch pattern from `migrate_chart_entries.py` to every table, split by how `bb_scrape.py` mutates each one:

- **Append-only** (`artist_list`, `song_list`, `album_list`, `chart_dates`, `chart_entries`) — `bb_scrape.py` only ever inserts new rows into these, never updates existing ones. Sync copies anything with a primary key greater than the target's current max, in the same resumable/idempotent chunked style as `migrate_chart_entries.py`. Fast after the first run, since it only pulls what's new.
- **Small, in-place-updated** (`chart_list`, `my_artist_id`) — `chart_list.last_date`/`next_date` get updated on *existing* rows as scraping progresses, so the append-only trick doesn't apply. Both are tiny (177 and 1 rows), so the sync just truncates and fully reloads them every run instead of doing real UPSERT logic.

Caveat: `chart_dates.item_count` and `artist_list`'s `sort_name`/`multi_artist`/`aka` columns are never touched by `bb_scrape.py` after a row's initial insert, so the append-only assumption holds for anything the scraper does. If something else ever hand-edits those columns on an already-synced (old) row, `sync_to_aiven.py` won't pick up that edit — only new rows get copied for append-only tables.

Usage: `python bb_script/sync_to_aiven.py` (reads `SOURCE_SERVICE_URI`/`TARGET_SERVICE_URI` from `bb_script/.env`). Safe to run anytime; does nothing destructive to already-synced rows in the append-only tables, and the two full-refresh tables are cheap enough that truncate-and-reload every time is a non-issue.

## Leftover local state

- `bb_script/aiven-db-migrate/` — patched clone from the first attempt, gitignored. Not needed for the working approach; kept in case `aiven-db-migrate` is ever revisited (e.g. if the networking prerequisite for #11 gets solved later and ongoing replication becomes worth doing).
- `bb_script/venv_aiven_migrate/` — Python 3.14 venv with the patched package installed, gitignored. Also used to run one-off Python snippets during the migration since it has `psycopg2` available.
- `bb_script/.env` — contains `SOURCE_SERVICE_URI` and `TARGET_SERVICE_URI`, gitignored. Used by both `migrate_chart_entries.py` and `sync_to_aiven.py`.
- `bb_script/migrate_chart_entries.py` — the one-off chunked migration script (superseded by `sync_to_aiven.py` for anything going forward, but left in place).
- `bb_script/sync_to_aiven.py` — the general-purpose on-demand sync script; this is the one to reach for from now on.
- `bb_script/chart_entries_migration_progress.txt` — progress-tracking file written by `migrate_chart_entries.py`, gitignored.
- Local Postgres `wal_level` is still set to `logical` (changed for #8 during the first attempt, service already restarted). Harmless to leave as-is; not needed for the plain-dump approach that ended up working.
