"""
Populates annual_top_songs: the top N songs of each calendar year, per chart,
computed from the existing get_range_song_chart() Postgres function.

Designed to run two ways:
- Imported and called (populate_annual_top_songs(conn)) at the end of a
  bb_scrape.py run, reusing its already-open connection, so annual rankings
  refresh automatically every time chart data is scraped.
- Run standalone (python annual_top_songs.py) for the initial backfill or an
  ad-hoc refresh, using its own connection read from server/.env.

A chart-year is "complete" once that chart's chart_list.last_date has passed
the end of that year -- once complete, a chart-year is never recomputed again
(see is_year_complete on the table). Still-incomplete chart-years are always
recomputed, so reruns stay cheap after the first full backfill while
in-progress years keep catching up to newly-scraped weeks.
"""
import datetime
import os
import sys

import psycopg2
import psycopg2.extras

from env_utils import load_env

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

CHARTS = [
    {"chart_id": 1,  "chart_name": "hot-100",                   "top_n": 100},
    {"chart_id": 45, "chart_name": "country-songs",              "top_n": 75},
    {"chart_id": 43, "chart_name": "adult-contemporary",         "top_n": 50},
    {"chart_id": 60, "chart_name": "alternative-airplay",        "top_n": 60},
    {"chart_id": 67, "chart_name": "hot-mainstream-rock-tracks", "top_n": 75},
]


def populate_annual_top_songs(conn, force=False):
    for chart in CHARTS:
        chart_id = chart["chart_id"]
        chart_name = chart["chart_name"]
        top_n = chart["top_n"]

        cur = conn.cursor()
        cur.execute(
            "SELECT first_date, last_date FROM chart_list WHERE chart_id = %s",
            (chart_id,),
        )
        row = cur.fetchone()
        cur.close()
        if row is None or row[0] is None or row[1] is None:
            print(f"[{chart_name}] no first_date/last_date on chart_list, skipping")
            continue
        first_date, last_date = row

        for year in range(first_date.year, last_date.year + 1):
            year_end = datetime.date(year, 12, 31)
            is_complete = last_date >= year_end

            if is_complete and not force:
                cur = conn.cursor()
                cur.execute(
                    "SELECT count(*), bool_and(is_year_complete) FROM annual_top_songs "
                    "WHERE chart_id = %s AND year = %s",
                    (chart_id, year),
                )
                existing_count, existing_complete = cur.fetchone()
                cur.close()
                if existing_count > 0 and existing_complete:
                    continue  # frozen -- a completed year is never recomputed again

            cur = conn.cursor()
            cur.execute(
                "SELECT get_range_song_chart(%s, %s, %s)",
                (chart_id, datetime.date(year, 1, 1), year_end),
            )
            json_rows = cur.fetchone()[0] or []
            cur.close()

            top_rows = [r for r in json_rows if r["song_rank"] <= top_n]
            if not top_rows:
                print(f"[{chart_name}] {year}: no songs, skipping")
                continue

            song_ids = [r["song_id"] for r in top_rows]
            cur = conn.cursor()
            cur.execute(
                "SELECT song_id, artist_id FROM song_list WHERE song_id = ANY(%s)",
                (song_ids,),
            )
            artist_id_by_song = dict(cur.fetchall())
            cur.close()

            insert_rows = [
                (
                    chart_id, chart_name, year, r["song_rank"], r["song_id"], r["song_title"],
                    artist_id_by_song.get(r["song_id"]), r["artist_name"],
                    r["peak"], r["points"], r["weeks"], is_complete,
                )
                for r in top_rows
                if r["song_id"] in artist_id_by_song
            ]
            if not insert_rows:
                print(f"[{chart_name}] {year}: no song_list matches found, leaving existing rows untouched")
                continue

            cur = conn.cursor()
            cur.execute(
                "DELETE FROM annual_top_songs WHERE chart_id = %s AND year = %s",
                (chart_id, year),
            )
            psycopg2.extras.execute_values(
                cur,
                "INSERT INTO annual_top_songs "
                "(chart_id, chart_name, year, year_rank, song_id, song_title, "
                " artist_id, artist_name, peak, points, weeks, is_year_complete) "
                "VALUES %s ON CONFLICT (chart_id, year, year_rank) DO NOTHING",
                insert_rows,
            )
            cur.close()
            conn.commit()
            print(f"[{chart_name}] {year}: {len(insert_rows)} rows ({'complete' if is_complete else 'in progress'})")


def main():
    force = "--force" in sys.argv
    env = load_env(os.path.join(SCRIPT_DIR, "..", "server", ".env"))
    conn = psycopg2.connect(
        dbname=env["PG_DATABASE"],
        user=env["PG_USER"],
        password=env["PG_PASSWORD"],
        host=env["PG_HOST"],
        port=env["PG_PORT"],
    )
    try:
        populate_annual_top_songs(conn, force=force)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
