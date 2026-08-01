CREATE OR REPLACE FUNCTION public.get_albums_by_artist(artist_to_find character varying)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
	jsonResponse JSON;
	entry record;
BEGIN
artist_to_find := (select concat('%', artist_to_find, '%'));

create temp table artist_albums on commit drop as 
select album_list.album_id as album_id, album_list.album_title, artist_list.artist_name, 
		min(chart_entries.rank) as peak, min(chart_dates.chart_date) as first_date, 
		max(chart_dates.chart_date) as last_date, count(chart_entries.rank) as weeks
	from album_list join artist_list on album_list.artist_id = artist_list.artist_id
	join chart_entries on album_list.album_id = chart_entries.source_id
	join chart_dates on chart_entries.chart_id = chart_dates.chart_date_id
	join chart_list on chart_list.chart_id = chart_dates.chart_id
	where artist_list.artist_name like artist_to_find and chart_list.chart_id = 2
	group by album_list.album_id, chart_list.chart_name, artist_list.artist_name
	order by first_date, album_list.album_id;

alter table artist_albums add column peak_weeks int;
for entry in (select * from artist_albums)
loop
	entry.peak_weeks := (select count(*) from (
select album_list.album_id, album_list.album_title, artist_list.artist_name, chart_dates.chart_date
from album_list join artist_list on album_list.artist_id = artist_list.artist_id
join chart_entries on album_list.album_id = chart_entries.source_id
join chart_dates on chart_entries.chart_id = chart_dates.chart_date_id
join chart_list on chart_list.chart_id = chart_dates.chart_id
where album_list.album_id = entry.album_id and chart_list.chart_id = 2 and rank=entry.peak
group by album_list.album_id, chart_list.chart_name, artist_list.artist_name, chart_dates.chart_date) t);
update artist_albums set peak_weeks = entry.peak_weeks where artist_albums.album_id = entry.album_id;
end loop;

    select array_to_json(array_agg(row_to_json(t))) into jsonResponse from (
select * from artist_albums
order by artist_albums.first_date ) t ;

RETURN jsonResponse;

END; $function$
;
