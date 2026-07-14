import billboard
import time
import datetime
import psycopg2
import logging

logging.basicConfig(filename='billboard.log', format='%(asctime)s: %(message)s', level=logging.INFO)
default_date = '1950-01-01'
last_chart_date = False
new_chart = False
DB_CONN_STRING = "dbname=BillboardData user=postgres password=1202ThurnRidge"
conn = psycopg2.connect(DB_CONN_STRING)
retrieve_Ids = False
active_lists = []


def ensure_connection():
    global conn
    if conn.closed:
        conn = psycopg2.connect(DB_CONN_STRING)
        logging.warning("Reconnected to the database after the connection was closed.")
        return
    try:
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
    except psycopg2.Error:
        try:
            conn.close()
        except Exception:
            pass
        conn = psycopg2.connect(DB_CONN_STRING)
        logging.warning("Reconnected to the database after a connection error.")



def retrieveChartIds():
    f = open("billboard.txt","w", encoding="utf-8")
    charts=billboard.charts()
    for entry in charts:
        print(entry)
        f.write(entry)
        f.write(":")
        chart = billboard.ChartData(entry,default_date,)
        print(chart.date)
        f.write(chart.date)
        f.write("\n")
        cur = conn.cursor()
        insert_chart_query = """ INSERT INTO chart_list (chart_id, chart_name, first_date) VALUES (DEFAULT, %s, %s)"""
        if (chart.date == default_date):
            begin_date = None
        else:
            begin_date = chart.date
        chart_to_insert = (entry, begin_date)
        cur.execute(insert_chart_query, chart_to_insert)
        conn.commit();
        time.sleep(10)
    f.close()


def getChartList():
    active_lists.clear()
    chartList = []
    cur = conn.cursor()
    list_query = """ SELECT chart_id, chart_name, chart_type, included FROM chart_list ORDER BY chart_id"""
    cur.execute(list_query)
    chartRows = cur.fetchall()
    for row in chartRows:
        if (row[3]):
            add_row = (row[0], row[1], row[2])
            active_lists.append(add_row)
    cur.close()
    
    
def getChartDate(gcid):
    cur = conn.cursor()
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
    cur = conn.cursor()
    chart_id_query = """ SELECT chart_id FROM chart_list WHERE chart_name = %s """
    name_to_check = (name,)
    cur.execute(chart_id_query, name_to_check)
    chart_id = cur.fetchone()
    return(chart_id[0])


def insertChartDateId(icid,icdate):
    cdateId = 0
    cur = conn.cursor()
    insert_date_query = """ INSERT INTO chart_dates (chart_date_id, chart_id, chart_date) VALUES (DEFAULT, %s, %s) RETURNING chart_date_id """
    date_to_insert = (icid, icdate)
    cur.execute(insert_date_query, date_to_insert)
    conn.commit()
    if cur.rowcount:
        cdateId = cur.fetchone()
    #cdateid = getChartDateId(icid,icdate,False)
    return (cdateId)


def getChartDateId(cid,cdate):
    cdateid = 0
    cur = conn.cursor()
    chart_date_id_query = """ SELECT chart_date_id FROM chart_dates WHERE chart_id = %s AND chart_date = %s  """
    chart_to_check = (cid,cdate)
    cur.execute(chart_date_id_query, chart_to_check)
    if not cur.rowcount:
        cdateid = insertChartDateId(cid,cdate)
    else:
        cdateid = cur.fetchone()
    return (cdateid)


def insertArtist(artistName):
    artistId = 0
    maxLength = 150
    cur = conn.cursor()
    insert_artist_query = """ INSERT INTO artist_list (artist_id, artist_name) VALUES (DEFAULT, %s) RETURNING artist_id """
    artist_to_insert = (artistName[:maxLength],)
    cur.execute(insert_artist_query, artist_to_insert)
    conn.commit()
    if cur.rowcount:
        artistId = cur.fetchone()
    return (artistId)


def getArtistId(artistName):
    artistId = 0
    cur = conn.cursor()
    artist_id_query = """ SELECT artist_id FROM artist_list WHERE artist_name = %s """
    artist_to_check = (artistName,)
    cur.execute(artist_id_query,artist_to_check)
    if not cur.rowcount:
        artistId = insertArtist(artistName)
    else:
        artistId = cur.fetchone()
    return (artistId)


def insertSong(songTitle, artistId):
    songId = 0
    cur = conn.cursor()
    insert_song_query = """ INSERT INTO song_list (song_id, song_title, artist_id) VALUES (DEFAULT, %s, %s) RETURNING song_id """
    song_to_insert = (songTitle, artistId)
    cur.execute(insert_song_query, song_to_insert)
    conn.commit()
    if cur.rowcount:
        songId = cur.fetchone()
    return (songId)

def insertAlbum(albumTitle, artistId):
    albumId = 0
    cur = conn.cursor()
    insert_album_query = """ INSERT INTO album_list (album_id, album_title, artist_id) VALUES (DEFAULT, %s, %s) RETURNING album_id """
    album_to_insert = (albumTitle, artistId)
    cur.execute(insert_album_query, album_to_insert)
    conn.commit()
    if cur.rowcount:
        albumId = cur.fetchone()
    return (albumId)
    
def getSongId(songTitle, artistId):
    songId = 0
    cur = conn.cursor()
    song_id_query = """ SELECT song_id FROM song_list WHERE song_title = %s AND artist_id = %s """
    song_to_check = (songTitle, artistId)
    cur.execute(song_id_query, song_to_check)
    if not cur.rowcount:
        songId = insertSong(songTitle,artistId)
    else:
        songId = cur.fetchone()
    return (songId)

def getAlbumId(albumTitle, artistId):
    albumId = 0
    cur = conn.cursor()
    album_id_query = """ SELECT album_id FROM album_list WHERE album_title = %s AND artist_id = %s """
    album_to_check = (albumTitle, artistId)
    cur.execute(album_id_query, album_to_check)
    if not cur.rowcount:
        albumId = insertAlbum(albumTitle,artistId)
    else:
        albumId = cur.fetchone()
    return (albumId)

def updateChartList(ucdate, ucndate, ucid):
    cur = conn.cursor()
    chart_list_query = """ UPDATE chart_list SET last_date= %s, next_date = %s WHERE chart_id = %s """
    chart_entry = (ucdate, ucndate, ucid)
    cur.execute(chart_list_query, chart_entry)
    conn.commit()

def updateChartDateItemCount(cdateid):
    cur = conn.cursor()
    count_query = """ SELECT count(*) FROM chart_entries WHERE chart_id = %s """
    cur.execute(count_query, (cdateid,))
    actual_count = cur.fetchone()[0]
    item_count_query = """ UPDATE chart_dates SET item_count = %s WHERE chart_date_id = %s """
    cur.execute(item_count_query, (actual_count, cdateid))
    conn.commit()

def insertChartEntry(songId, chartRank, chartId):
    entryId = 0
    cur = conn.cursor()
    insert_entry_query = """ INSERT INTO chart_entries (entry_id, source_id, rank, chart_id) VALUES (DEFAULT, %s, %s, %s) RETURNING entry_id """
    entry_to_insert = (songId, chartRank, chartId)
    try:
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
            print("Now starting %s" % chart_name)
            logging.info("Now starting %s" % chart_name)
            current_chart_id = curList[0]
            if (curList[2] == 'Song'):
                getSong = True
                getAlbum = False
            elif (curList[2] == 'Album'):
                getSong = False
                getAlbum = True
            last_date = False
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
                        time.sleep(10)
                        continue

                    items_in_chart = 0
                    for item in chart:
                        items_in_chart += 1
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
                    updateChartDateItemCount(chart_date_id)
                    print ("%d entries entered for %s chart for the date %s" % (entries_entered, chart_name, chart_date))

                    if items_in_chart == 0:
                        # Billboard has no entries for this date yet (e.g. not published), as
                        # opposed to entries_entered==0 meaning they were all duplicates of
                        # already-scraped data. Don't advance the cursor past a chart with no
                        # real data - retry this same date on the next run.
                        print ("No entries found for %s on %s - not yet published, will retry later" % (chart_name, chart_date))
                        last_date = True
                    else:
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
                    time.sleep(10)
            last_chart_date = True;
conn.close()


