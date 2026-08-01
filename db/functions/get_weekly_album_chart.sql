CREATE OR REPLACE FUNCTION public.get_weekly_album_chart(weekly_chart_id integer, weekly_chart_date date)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
	jsonResponse JSON;
BEGIN
    select array_to_json(array_agg(row_to_json(t))) into jsonResponse from (
select chart_entries.rank as album_rank, album_list.album_id, album_list.album_title, artist_list.artist_name from chart_entries
join chart_dates on chart_entries.chart_id = chart_dates.chart_date_id
join album_list on chart_entries.source_id = album_list.album_id
join artist_list on album_list.artist_id = artist_list.artist_id
where chart_dates.chart_id = weekly_chart_id and chart_dates.chart_date = weekly_chart_date
order by chart_dates.chart_date desc, album_rank) t ;

RETURN jsonResponse;

END; $function$
;
