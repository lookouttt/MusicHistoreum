CREATE OR REPLACE FUNCTION public.get_weekly_song_chart(weekly_chart_id integer, weekly_chart_date date)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
	jsonResponse JSON;
BEGIN
    select array_to_json(array_agg(row_to_json(t))) into jsonResponse from (
select chart_entries.rank as song_rank, song_list.song_id, song_list.song_title, artist_list.artist_name from chart_entries
join chart_dates on chart_entries.chart_id = chart_dates.chart_date_id
join song_list on chart_entries.source_id = song_list.song_id
join artist_list on song_list.artist_id = artist_list.artist_id
where chart_dates.chart_id = weekly_chart_id and chart_dates.chart_date = weekly_chart_date
order by chart_dates.chart_date desc, song_rank) t ;

RETURN jsonResponse;

END; $function$
;
