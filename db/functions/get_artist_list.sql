CREATE OR REPLACE FUNCTION public.get_artist_list(starting_char character)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
	jsonResponse JSON;
BEGIN

WITH artist_table AS (
	select distinct artist_list.artist_name
	from song_list join artist_list on song_list.artist_id = artist_list.artist_id
	join chart_entries on song_list.song_id = chart_entries.source_id
	join chart_dates on chart_entries.chart_id = chart_dates.chart_date_id
	join chart_list on chart_list.chart_id = chart_dates.chart_id
	where chart_list.chart_id in (1, 43, 45, 60, 67, 68)
	UNION
	select distinct artist_list.artist_name
	from album_list join artist_list on album_list.artist_id = artist_list.artist_id
	join chart_entries on album_list.album_id = chart_entries.source_id
	join chart_dates on chart_entries.chart_id = chart_dates.chart_date_id
	join chart_list on chart_list.chart_id = chart_dates.chart_id
	where chart_list.chart_id in (2, 46, 53, 58, 69)
)
select array_to_json(array_agg(row_to_json(t))) into jsonResponse from (
	select artist_name from artist_table
	where starting_char = '!'
	   or (
	        ((starting_char >= '0' and starting_char <= '9') or (starting_char >= 'A' and starting_char <= 'Z'))
	        and artist_name similar to (starting_char || '%')
	      )
	   or (
	        starting_char = '*'
	        and artist_name not similar to ('[A-Za-z0-9]%')
	      )
	order by artist_name
) t;

RETURN jsonResponse;

END;
$function$
;
