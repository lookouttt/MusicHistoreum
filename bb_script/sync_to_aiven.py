"""
On-demand one-way sync of the local BillboardData database into the Aiven
target. Run this any time after bb_scrape.py has added new data locally and
you want the Aiven copy caught up - there's no live replication set up
(see docs/aiven-migration-notes.md for why), so this is the manual
equivalent.

Two sync strategies, chosen per table based on how bb_scrape.py mutates it:

- Append-only tables (bb_scrape.py only ever INSERTs new rows into these,
  never updates existing ones): copy in chunks, resuming from whatever the
  target's current max primary key already is, using a fresh connection per
  batch. A single long-lived COPY of a large table to Aiven reliably drops
  the connection after 60-90s (see docs/aiven-migration-notes.md); batching
  with short-lived connections sidesteps that regardless of root cause.
- Small tables bb_scrape.py updates in place (chart_list's last_date/
  next_date move forward as scraping progresses; my_artist_id is a
  single-row table): truncate and fully reload every run instead - both are
  tiny, so this is cheap and avoids needing real UPSERT logic.

Caveat: artist_list has sort_name/multi_artist/aka columns and chart_dates
has item_count - none of these are ever touched by bb_scrape.py after a
row's initial insert, so the append-only assumption holds for anything
bb_scrape.py does. If something else ever hand-edits those columns on an
already-synced (old) row, this script won't pick up that edit - only new
rows get copied for append-only tables.

Reads SOURCE_SERVICE_URI / TARGET_SERVICE_URI from bb_script/.env.
"""
import os
import sys
import time

import psycopg2
import psycopg2.extras

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BATCH_SIZE = 100_000
MAX_RETRIES = 5
RETRY_DELAY_SECONDS = 5

# Order matters for readability/intuition only - there are no FK constraints
# in this schema, so nothing here is required for correctness.
APPEND_ONLY_TABLES = {
    "artist_list": {"pk": "artist_id", "columns": ["artist_id", "artist_name", "sort_name", "multi_artist", "aka"]},
    "song_list": {"pk": "song_id", "columns": ["song_id", "song_title", "artist_id"]},
    "album_list": {"pk": "album_id", "columns": ["album_id", "album_title", "artist_id"]},
    "chart_dates": {"pk": "chart_date_id", "columns": ["chart_date_id", "chart_id", "chart_date", "item_count"]},
    "chart_entries": {"pk": "entry_id", "columns": ["entry_id", "source_id", "rank", "chart_id"]},
}

FULL_REFRESH_TABLES = {
    "chart_list": [
        "chart_id", "chart_name", "first_date", "last_date", "next_date", "chart_type", "included", "online"
    ],
    "my_artist_id": ["artist_id"],
}


def load_env(path):
    env = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip()
    return env


def sync_full_refresh_table(source_uri, target_uri, table, columns):
    print(f"[{table}] full refresh...")
    src = psycopg2.connect(source_uri)
    try:
        cur = src.cursor()
        cur.execute(f"SELECT {', '.join(columns)} FROM {table}")
        rows = cur.fetchall()
    finally:
        src.close()

    tgt = psycopg2.connect(target_uri)
    try:
        cur = tgt.cursor()
        cur.execute(f"TRUNCATE TABLE {table}")
        if rows:
            psycopg2.extras.execute_values(cur, f"INSERT INTO {table} ({', '.join(columns)}) VALUES %s", rows)
        tgt.commit()
    finally:
        tgt.close()
    print(f"[{table}] {len(rows)} rows refreshed.")


def get_target_max_pk(target_uri, table, pk):
    conn = psycopg2.connect(target_uri)
    try:
        cur = conn.cursor()
        cur.execute(f"SELECT COALESCE(MAX({pk}), 0) FROM {table}")
        return cur.fetchone()[0]
    finally:
        conn.close()


def fetch_batch(source_uri, table, pk, columns, after_id, limit):
    conn = psycopg2.connect(source_uri)
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT {', '.join(columns)} FROM {table} WHERE {pk} > %s ORDER BY {pk} LIMIT %s",
            (after_id, limit),
        )
        return cur.fetchall()
    finally:
        conn.close()


def insert_batch(target_uri, table, pk, columns, rows):
    conn = psycopg2.connect(target_uri)
    try:
        cur = conn.cursor()
        psycopg2.extras.execute_values(
            cur,
            f"INSERT INTO {table} ({', '.join(columns)}) VALUES %s ON CONFLICT ({pk}) DO NOTHING",
            rows,
        )
        conn.commit()
    finally:
        conn.close()


def sync_sequence(target_uri, table, pk):
    conn = psycopg2.connect(target_uri)
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT column_default FROM information_schema.columns WHERE table_name=%s AND column_name=%s",
            (table, pk),
        )
        row = cur.fetchone()
        if row and row[0] and "nextval" in row[0]:
            seq_name = row[0].split("'")[1]
            cur.execute(f"SELECT setval('{seq_name}', (SELECT MAX({pk}) FROM {table}))")
            conn.commit()
    finally:
        conn.close()


def sync_append_only_table(source_uri, target_uri, table, pk, columns):
    after_id = get_target_max_pk(target_uri, table, pk)
    print(f"[{table}] syncing rows after {pk}={after_id}...")
    pk_index = columns.index(pk)
    total = 0
    while True:
        batch = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                batch = fetch_batch(source_uri, table, pk, columns, after_id, BATCH_SIZE)
                break
            except psycopg2.OperationalError as e:
                print(f"[{table}][fetch] attempt {attempt}/{MAX_RETRIES} failed: {e}")
                time.sleep(RETRY_DELAY_SECONDS)
        if batch is None:
            sys.exit(f"[{table}] giving up fetching batch after {after_id}")

        if not batch:
            break

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                insert_batch(target_uri, table, pk, columns, batch)
                break
            except psycopg2.OperationalError as e:
                print(f"[{table}][insert] attempt {attempt}/{MAX_RETRIES} failed: {e}")
                time.sleep(RETRY_DELAY_SECONDS)
        else:
            sys.exit(f"[{table}] giving up inserting batch after {after_id}")

        after_id = batch[-1][pk_index]
        total += len(batch)
        print(f"[{table}] copied {total} new rows so far (up to {pk}={after_id})")

    sync_sequence(target_uri, table, pk)
    print(f"[{table}] done, {total} new rows copied.")


def main():
    env = load_env(os.path.join(SCRIPT_DIR, ".env"))
    source_uri = env.get("SOURCE_SERVICE_URI") or os.environ.get("SOURCE_SERVICE_URI")
    target_uri = env.get("TARGET_SERVICE_URI") or os.environ.get("TARGET_SERVICE_URI")
    if not source_uri or not target_uri:
        sys.exit("SOURCE_SERVICE_URI and TARGET_SERVICE_URI must be set in bb_script/.env")

    for table, columns in FULL_REFRESH_TABLES.items():
        sync_full_refresh_table(source_uri, target_uri, table, columns)

    for table, cfg in APPEND_ONLY_TABLES.items():
        sync_append_only_table(source_uri, target_uri, table, cfg["pk"], cfg["columns"])

    print("Sync complete.")


if __name__ == "__main__":
    main()
