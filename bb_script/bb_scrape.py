"""
Scrapes Billboard chart data (via the billboard.py library) and populates chart_list,
chart_dates, artist_list, song_list, album_list, and chart_entries in Postgres. Run
manually/out-of-band (see weekly_update.bat); not invoked by the server or client.
"""
import billboard
import time
import datetime
import os
import psycopg2
import logging

from annual_top_songs import populate_annual_top_songs
from env_utils import load_env

logging.basicConfig(
    format='%(asctime)s: %(message)s',
    level=logging.INFO,
    handlers=[logging.FileHandler('billboard.log'), logging.StreamHandler()],
)
SCRAPE_DELAY_SECONDS = 10  # pause between Billboard requests, to avoid hammering the site
default_date = '1950-01-01'
last_chart_date = False
new_chart = False
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_CONN_STRING = load_env(os.path.join(SCRIPT_DIR, ".env"))["SOURCE_SERVICE_URI"]
conn = psycopg2.connect(DB_CONN_STRING)
retrieve_Ids = False
active_lists = []
# optional comma-separated chart_name filter for a one-off scoped run, e.g.
# BB_SCRAPE_ONLY="christian-airplay,jazz-songs" python bb_scrape.py
# unset (the normal/automatic case) processes every included=true chart, same as always
TARGET_CHARTS = set(os.environ['BB_SCRAPE_ONLY'].split(',')) if os.environ.get('BB_SCRAPE_ONLY') else None


def ensure_connection():
    """Reconnect to the database if the connection was closed or has gone bad."""
    global conn
    if conn.closed:
        conn = psycopg2.connect(DB_CONN_STRING)
        logging.warning("Reconnected to the database after the connection was closed.")
        return
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
    except psycopg2.Error:
        try:
            conn.close()
        except Exception:
            pass
        conn = psycopg2.connect(DB_CONN_STRING)
        logging.warning("Reconnected to the database after a connection error.")



def retrieveChartIds():
    """One-off backfill: discover every chart Billboard publishes and seed chart_list with each."""
    with open("billboard.txt", "w", encoding="utf-8") as f:
        charts = billboard.charts()
        for entry in charts:
            print(entry)
            f.write(entry)
            f.write(":")
            chart = billboard.ChartData(entry,default_date,)
            print(chart.date)
            f.write(chart.date)
            f.write("\n")
            with conn.cursor() as cur:
                insert_chart_query = """ INSERT INTO chart_list (chart_id, chart_name, first_date) VALUES (DEFAULT, %s, %s)"""
                if (chart.date == default_date):
                    begin_date = None
                else:
                    begin_date = chart.date
                chart_to_insert = (entry, begin_date)
                cur.execute(insert_chart_query, chart_to_insert)
                conn.commit();
            time.sleep(SCRAPE_DELAY_SECONDS)


def getChartList():
    """Refresh active_lists with every included=true chart, optionally scoped by BB_SCRAPE_ONLY."""
    active_lists.clear()
    with conn.cursor() as cur:
        list_query = """ SELECT chart_id, chart_name, chart_type, included FROM chart_list ORDER BY chart_id"""
        cur.execute(list_query)
        chartRows = cur.fetchall()
    for row in chartRows:
        if row[3] and (TARGET_CHARTS is None or row[1] in TARGET_CHARTS):
            add_row = (row[0], row[1], row[2])
            active_lists.append(add_row)


def getChartDate(gcid):
    """Return the next date to scrape for a chart: next_date if resuming, else derived from last_date/first_date."""
    with conn.cursor() as cur:
        chart_id_query = """ SELECT next_date, last_date, first_date FROM chart_list WHERE chart_id = %s """
        id_to_check = (gcid,)
        cur.execute(chart_id_query, id_to_check)
        found_date = cur.fetchone()
    if found_date[0] == None:
        if found_date[1] == None:
            return (found_date[2])
        else:
            return(found_date[1] + datetime.timedelta(days=7))
    else:
        return(found_date[0])

def getChartId(name):
    with conn.cursor() as cur:
        chart_id_query = """ SELECT chart_id FROM chart_list WHERE chart_name = %s """
        name_to_check = (name,)
        cur.execute(chart_id_query, name_to_check)
        chart_id = cur.fetchone()
    return(chart_id[0])


def insertChartDateId(icid,icdate):
    cdateId = 0
    with conn.cursor() as cur:
        insert_date_query = """ INSERT INTO chart_dates (chart_date_id, chart_id, chart_date) VALUES (DEFAULT, %s, %s) RETURNING chart_date_id """
        date_to_insert = (icid, icdate)
        cur.execute(insert_date_query, date_to_insert)
        conn.commit()
        if cur.rowcount:
            cdateId = cur.fetchone()
    return (cdateId)


def getChartDateId(cid,cdate):
    """Look up a chart_date row's id, inserting it first if this (chart, date) pair is new."""
    cdateid = 0
    with conn.cursor() as cur:
        chart_date_id_query = """ SELECT chart_date_id FROM chart_dates WHERE chart_id = %s AND chart_date = %s  """
        chart_to_check = (cid,cdate)
        cur.execute(chart_date_id_query, chart_to_check)
        found = cur.rowcount
        if found:
            cdateid = cur.fetchone()
    if not found:
        cdateid = insertChartDateId(cid,cdate)
    return (cdateid)


def insertArtist(artistName):
    artistId = 0
    maxLength = 150
    with conn.cursor() as cur:
        insert_artist_query = """ INSERT INTO artist_list (artist_id, artist_name) VALUES (DEFAULT, %s) RETURNING artist_id """
        artist_to_insert = (artistName[:maxLength],)
        cur.execute(insert_artist_query, artist_to_insert)
        conn.commit()
        if cur.rowcount:
            artistId = cur.fetchone()
    return (artistId)


def getArtistId(artistName):
    """Look up an artist's id by exact name, inserting a new artist_list row if not found."""
    artistId = 0
    with conn.cursor() as cur:
        artist_id_query = """ SELECT artist_id FROM artist_list WHERE artist_name = %s """
        artist_to_check = (artistName,)
        cur.execute(artist_id_query,artist_to_check)
        found = cur.rowcount
        if found:
            artistId = cur.fetchone()
    if not found:
        artistId = insertArtist(artistName)
    return (artistId)


def insertSong(songTitle, artistId):
    songId = 0
    with conn.cursor() as cur:
        insert_song_query = """ INSERT INTO song_list (song_id, song_title, artist_id) VALUES (DEFAULT, %s, %s) RETURNING song_id """
        song_to_insert = (songTitle, artistId)
        cur.execute(insert_song_query, song_to_insert)
        conn.commit()
        if cur.rowcount:
            songId = cur.fetchone()
    return (songId)

def insertAlbum(albumTitle, artistId):
    albumId = 0
    with conn.cursor() as cur:
        insert_album_query = """ INSERT INTO album_list (album_id, album_title, artist_id) VALUES (DEFAULT, %s, %s) RETURNING album_id """
        album_to_insert = (albumTitle, artistId)
        cur.execute(insert_album_query, album_to_insert)
        conn.commit()
        if cur.rowcount:
            albumId = cur.fetchone()
    return (albumId)

def getSongId(songTitle, artistId):
    """Look up a song's id by (title, artist), inserting a new song_list row if not found."""
    songId = 0
    with conn.cursor() as cur:
        song_id_query = """ SELECT song_id FROM song_list WHERE song_title = %s AND artist_id = %s """
        song_to_check = (songTitle, artistId)
        cur.execute(song_id_query, song_to_check)
        found = cur.rowcount
        if found:
            songId = cur.fetchone()
    if not found:
        songId = insertSong(songTitle,artistId)
    return (songId)

def getAlbumId(albumTitle, artistId):
    """Look up an album's id by (title, artist), inserting a new album_list row if not found."""
    albumId = 0
    with conn.cursor() as cur:
        album_id_query = """ SELECT album_id FROM album_list WHERE album_title = %s AND artist_id = %s """
        album_to_check = (albumTitle, artistId)
        cur.execute(album_id_query, album_to_check)
        found = cur.rowcount
        if found:
            albumId = cur.fetchone()
    if not found:
        albumId = insertAlbum(albumTitle,artistId)
    return (albumId)

def updateChartList(ucdate, ucndate, ucid):
    """Advance a chart's last_date/next_date resume cursors after a successful week."""
    with conn.cursor() as cur:
        chart_list_query = """ UPDATE chart_list SET last_date= %s, next_date = %s WHERE chart_id = %s """
        chart_entry = (ucdate, ucndate, ucid)
        cur.execute(chart_list_query, chart_entry)
        conn.commit()

def updateNextDate(undate, unid):
    # Advances only the resume cursor (next_date), leaving last_date untouched -- used when a
    # week comes back empty so we don't claim real data coverage through a date that had none.
    with conn.cursor() as cur:
        next_date_query = """ UPDATE chart_list SET next_date = %s WHERE chart_id = %s """
        cur.execute(next_date_query, (undate, unid))
        conn.commit()

def updateChartDateItemCount(cdateid):
    """Record how many entries a chart_date actually got, for downstream point-scoring math."""
    with conn.cursor() as cur:
        count_query = """ SELECT count(*) FROM chart_entries WHERE chart_id = %s """
        cur.execute(count_query, (cdateid,))
        actual_count = cur.fetchone()[0]
        item_count_query = """ UPDATE chart_dates SET item_count = %s WHERE chart_date_id = %s """
        cur.execute(item_count_query, (actual_count, cdateid))
        conn.commit()

def insertChartEntry(songId, chartRank, chartId):
    """Insert a chart_entries row; a unique-violation (already-scraped duplicate) is expected, not an error."""
    entryId = 0
    insert_entry_query = """ INSERT INTO chart_entries (entry_id, source_id, rank, chart_id) VALUES (DEFAULT, %s, %s, %s) RETURNING entry_id """
    entry_to_insert = (songId, chartRank, chartId)
    try:
        with conn.cursor() as cur:
            cur.execute(insert_entry_query, entry_to_insert)
            conn.commit()
            if cur.rowcount:
                currow = cur.fetchone()
                entryId = currow[0]
    except psycopg2.Error as err:
        error = err.pgcode
        if (error == '23505'):
            print ("Duplicate Entry not Entered into table")
            logging.warning('Duplicate entry not entered into table - %s', entry_to_insert)
        conn.rollback()
    return (entryId) 


if retrieve_Ids == True:
    retrieveChartIds()
else:
    while not last_chart_date:
        getChartList()
        getAlbum = False
        getSong = False
        for curList in active_lists:
            chart_name = curList[1]
            logging.info("Now starting %s" % chart_name)
            current_chart_id = curList[0]
            if (curList[2] == 'Song'):
                getSong = True
                getAlbum = False
            elif (curList[2] == 'Album'):
                getSong = False
                getAlbum = True
            last_date = False
            consecutive_empty = 0
            EMPTY_WEEK_RETRY_LIMIT = 8  # tolerate a handful of isolated missing weeks before giving up on this chart for the run
            while not last_date:
                skip_chart = False
                entries_entered = 0

                try:
                    ensure_connection()
                    chart_date = getChartDate(current_chart_id)
                except psycopg2.OperationalError as db_error:
                    logging.error("Database error while checking chart date for %s: %s - reconnecting and retrying", chart_name, db_error)
                    print("Database error while checking chart date for %s - reconnecting and retrying" % chart_name)
                    ensure_connection()
                    time.sleep(5)
                    continue

                if chart_date > (datetime.date.today() + datetime.timedelta(days=4)):
                    skip_chart = True
                    last_date = True
                    print ("No current chart to check - Move on")

                if (not skip_chart):
                    try:
                        chart_date_id = getChartDateId(current_chart_id, chart_date)
                        chart = billboard.ChartData(chart_name,chart_date)
                    except psycopg2.OperationalError as db_error:
                        logging.error("Database error while fetching %s for %s: %s - reconnecting and retrying", chart_name, chart_date, db_error)
                        print("Database error while fetching %s for %s - reconnecting and retrying" % (chart_name, chart_date))
                        ensure_connection()
                        time.sleep(5)
                        continue
                    except Exception as fetch_error:
                        logging.error("Failed to fetch %s chart for %s: %s", chart_name, chart_date, fetch_error)
                        print("Failed to fetch %s chart for %s: %s - will retry on a future run" % (chart_name, chart_date, fetch_error))
                        last_date = True
                        time.sleep(SCRAPE_DELAY_SECONDS)
                        continue

                    items_in_chart = 0
                    for item in chart:
                        items_in_chart += 1
                        try:
                            artist_id = getArtistId(item.artist)
                            if (getSong):
                                item_id = getSongId(item.title, artist_id)
                            elif (getAlbum):
                                item_id = getAlbumId(item.title, artist_id)
                            entry_id = insertChartEntry(item_id, item.rank, chart_date_id)
                            if (entry_id > 0):
                                entries_entered += 1
                            else:
                                logging.info("Duplicate item - %s", item)
                        except psycopg2.Error as item_error:
                            # One bad row (or a transient DB hiccup) shouldn't crash the whole
                            # scrape run - log it and move on to the next chart item.
                            logging.error("Failed to insert chart item %s for %s on %s: %s", item, chart_name, chart_date, item_error)
                            print("Failed to insert chart item %s - skipping and continuing" % (item,))
                            conn.rollback()
                            ensure_connection()
                    updateChartDateItemCount(chart_date_id)
                    print ("%d entries entered for %s chart for the date %s" % (entries_entered, chart_name, chart_date))

                    if items_in_chart == 0:
                        # Billboard has no entries for this date. This is usually genuinely
                        # not-yet-published (chart_date is near today), but can also be an
                        # isolated one-off gap in Billboard's own archive for an otherwise-fine
                        # chart -- confirmed 2026-08-07: alternative-airplay returned 0 items for
                        # 2025-07-19 specifically, while every surrounding week (including weeks
                        # before AND after) had 40 items. Retry a few subsequent weeks before
                        # concluding this chart is really caught up, so one missing week doesn't
                        # permanently wall off everything after it. Deliberately does NOT call
                        # updateChartList here -- that would set last_date to a date with no real
                        # data, misrepresenting how far this chart's actual coverage extends.
                        consecutive_empty += 1
                        if consecutive_empty > EMPTY_WEEK_RETRY_LIMIT:
                            print ("No entries found for %s on %s after %d consecutive empty weeks - not yet published, will retry later" % (chart_name, chart_date, EMPTY_WEEK_RETRY_LIMIT))
                            last_date = True
                        else:
                            next_attempt = chart_date + datetime.timedelta(days=7)
                            print ("No entries found for %s on %s - trying %s next (%d/%d empty weeks so far)" % (chart_name, chart_date, next_attempt, consecutive_empty, EMPTY_WEEK_RETRY_LIMIT))
                            updateNextDate(next_attempt, current_chart_id)
                    else:
                        consecutive_empty = 0
                        try:
                            if ((hasattr(chart, 'nextDate')) and (chart.nextDate == '')) or (not hasattr(chart, 'nextDate')):
                                print ("This is the last chart for %s" % chart_name)
                                last_date = True
                                updateChartList(chart_date, chart_date + datetime.timedelta(days=7), current_chart_id)
                            else:
                                updateChartList(chart_date, chart.nextDate, current_chart_id)
                        except AttributeError as error:
                            print(chart)
                            print ("Error encountered (%s) - This is the last chart" % error)
                            last_date = True
                    time.sleep(SCRAPE_DELAY_SECONDS)
            last_chart_date = True;
    populate_annual_top_songs(conn)
conn.close()


