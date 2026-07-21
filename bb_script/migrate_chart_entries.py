"""
Resumable, chunked copy of chart_entries from the local source DB to the Aiven
target. A single long-lived pg_restore COPY of this table (4.85M rows, 423MB)
reliably drops mid-transfer after 60-90s (see docs/aiven-migration-notes.md).
This works around it by opening a fresh target connection per batch and
committing in small chunks, so a dropped connection only costs one batch.

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
PROGRESS_FILE = os.path.join(SCRIPT_DIR, "chart_entries_migration_progress.txt")


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


def get_target_max_entry_id(target_uri):
    conn = psycopg2.connect(target_uri)
    try:
        cur = conn.cursor()
        cur.execute("SELECT COALESCE(MAX(entry_id), 0) FROM chart_entries")
        return cur.fetchone()[0]
    finally:
        conn.close()


def read_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, encoding="utf-8") as f:
            content = f.read().strip()
            return int(content) if content else 0
    return 0


def write_progress(last_id):
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        f.write(str(last_id))


def fetch_batch(source_uri, after_id, limit):
    conn = psycopg2.connect(source_uri)
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT entry_id, source_id, rank, chart_id FROM chart_entries "
            "WHERE entry_id > %s ORDER BY entry_id LIMIT %s",
            (after_id, limit),
        )
        return cur.fetchall()
    finally:
        conn.close()


def insert_batch(target_uri, rows):
    conn = psycopg2.connect(target_uri)
    try:
        cur = conn.cursor()
        psycopg2.extras.execute_values(
            cur,
            "INSERT INTO chart_entries (entry_id, source_id, rank, chart_id) VALUES %s "
            "ON CONFLICT (entry_id) DO NOTHING",
            rows,
        )
        conn.commit()
    finally:
        conn.close()


def main():
    env = load_env(os.path.join(SCRIPT_DIR, ".env"))
    source_uri = env.get("SOURCE_SERVICE_URI") or os.environ.get("SOURCE_SERVICE_URI")
    target_uri = env.get("TARGET_SERVICE_URI") or os.environ.get("TARGET_SERVICE_URI")
    if not source_uri or not target_uri:
        sys.exit("SOURCE_SERVICE_URI and TARGET_SERVICE_URI must be set in bb_script/.env")

    target_max = get_target_max_entry_id(target_uri)
    file_progress = read_progress()
    after_id = max(target_max, file_progress)
    print(f"Resuming after entry_id={after_id} (target max={target_max}, progress file={file_progress})")

    total_copied = 0
    start_time = time.monotonic()
    while True:
        batch = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                batch = fetch_batch(source_uri, after_id, BATCH_SIZE)
                break
            except psycopg2.OperationalError as e:
                print(f"[fetch] attempt {attempt}/{MAX_RETRIES} failed: {e}")
                time.sleep(RETRY_DELAY_SECONDS)
        if batch is None:
            sys.exit(f"Giving up fetching batch after {after_id}: too many retries")

        if not batch:
            print("No more rows to copy.")
            break

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                insert_batch(target_uri, batch)
                break
            except psycopg2.OperationalError as e:
                print(f"[insert] attempt {attempt}/{MAX_RETRIES} failed: {e}")
                time.sleep(RETRY_DELAY_SECONDS)
        else:
            sys.exit(f"Giving up inserting batch after {after_id}: too many retries")

        after_id = batch[-1][0]
        write_progress(after_id)
        total_copied += len(batch)
        elapsed = time.monotonic() - start_time
        print(f"Copied {total_copied} rows so far (up to entry_id={after_id}), elapsed {elapsed:.1f}s")

    conn = psycopg2.connect(target_uri)
    try:
        cur = conn.cursor()
        cur.execute("SELECT setval('chart_entries_entry_id_seq', (SELECT MAX(entry_id) FROM chart_entries))")
        conn.commit()
        print("Sequence chart_entries_entry_id_seq synced to target max entry_id.")
    finally:
        conn.close()

    print(f"Done. Total rows copied this run: {total_copied}")


if __name__ == "__main__":
    main()
