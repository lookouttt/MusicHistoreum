-- Orphan-row audit for the no-FK-constraints schema (see B2 in docs/site-hardening-audit.md).
--
-- This schema deliberately has no foreign key constraints anywhere - bb_scrape.py's
-- lookup-or-insert flow depends on that friction-free insert path. That means nothing in
-- the database itself would catch a row pointing at a nonexistent parent; this query is a
-- manual/periodic substitute for that check. Every SELECT below should return zero rows in
-- a healthy database. Run ad hoc (e.g. after a scrape run, or when investigating unexpected
-- chart output) - this is not wired into any automated job.
--
-- Note the non-obvious column mapping used throughout the schema: chart_entries.chart_id
-- actually references chart_dates.chart_date_id, NOT chart_list.chart_id directly.

-- 1. song_list rows whose artist_id has no matching artist_list row.
SELECT 'song_list.artist_id -> artist_list' AS check_name, song_list.song_id AS orphan_id
FROM song_list
LEFT JOIN artist_list ON song_list.artist_id = artist_list.artist_id
WHERE artist_list.artist_id IS NULL;

-- 2. album_list rows whose artist_id has no matching artist_list row.
SELECT 'album_list.artist_id -> artist_list' AS check_name, album_list.album_id AS orphan_id
FROM album_list
LEFT JOIN artist_list ON album_list.artist_id = artist_list.artist_id
WHERE artist_list.artist_id IS NULL;

-- 3. chart_dates rows whose chart_id has no matching chart_list row.
SELECT 'chart_dates.chart_id -> chart_list' AS check_name, chart_dates.chart_date_id AS orphan_id
FROM chart_dates
LEFT JOIN chart_list ON chart_dates.chart_id = chart_list.chart_id
WHERE chart_list.chart_id IS NULL;

-- 4. chart_entries rows whose chart_id has no matching chart_dates row
--    (chart_entries.chart_id -> chart_dates.chart_date_id, not chart_list.chart_id).
SELECT 'chart_entries.chart_id -> chart_dates.chart_date_id' AS check_name, chart_entries.entry_id AS orphan_id
FROM chart_entries
LEFT JOIN chart_dates ON chart_entries.chart_id = chart_dates.chart_date_id
WHERE chart_dates.chart_date_id IS NULL;

-- 5. chart_entries rows whose source_id has no matching row in the table implied by that
--    chart's type (Song -> song_list, Album -> album_list). Requires joining through
--    chart_dates/chart_list to know which type applies to a given entry.
SELECT 'chart_entries.source_id -> song_list (Song charts)' AS check_name, chart_entries.entry_id AS orphan_id
FROM chart_entries
JOIN chart_dates ON chart_entries.chart_id = chart_dates.chart_date_id
JOIN chart_list ON chart_dates.chart_id = chart_list.chart_id
LEFT JOIN song_list ON chart_entries.source_id = song_list.song_id
WHERE chart_list.chart_type = 'Song' AND song_list.song_id IS NULL;

SELECT 'chart_entries.source_id -> album_list (Album charts)' AS check_name, chart_entries.entry_id AS orphan_id
FROM chart_entries
JOIN chart_dates ON chart_entries.chart_id = chart_dates.chart_date_id
JOIN chart_list ON chart_dates.chart_id = chart_list.chart_id
LEFT JOIN album_list ON chart_entries.source_id = album_list.album_id
WHERE chart_list.chart_type = 'Album' AND album_list.album_id IS NULL;
