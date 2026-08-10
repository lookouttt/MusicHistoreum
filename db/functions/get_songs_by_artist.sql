CREATE OR REPLACE FUNCTION public.get_songs_by_artist(artist_to_find character varying)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
	jsonResponse JSON;
BEGIN
	artist_to_find := concat('%', artist_to_find, '%');

	select array_to_json(array_agg(row_to_json(t))) into jsonResponse
	from (
		select song_id, song_title, artist_name, peak, first_date, last_date, weeks, peak_weeks
		from (
			select song_id,
			       song_title,
			       artist_name,
			       peak,
			       min(chart_date)                        as first_date,
			       max(chart_date)                        as last_date,
			       count(rank)                            as weeks,
			       count(*) filter (where rank = peak)    as peak_weeks
			from (
				select song_list.song_id                                              as song_id,
				       song_list.song_title                                           as song_title,
				       artist_list.artist_name                                        as artist_name,
				       chart_entries.rank                                             as rank,
				       chart_dates.chart_date                                         as chart_date,
				       min(chart_entries.rank) over (partition by song_list.song_id)  as peak
				from song_list
				join artist_list  on song_list.artist_id = artist_list.artist_id
				join chart_entries on song_list.song_id = chart_entries.source_id
				join chart_dates  on chart_entries.chart_id = chart_dates.chart_date_id
				join chart_list   on chart_list.chart_id = chart_dates.chart_id
				where artist_list.artist_name like artist_to_find
				  and chart_list.chart_id = 1
			) e
			group by song_id, song_title, artist_name, peak
		) s
		order by first_date, song_id
	) t;

	RETURN jsonResponse;
END; $function$
;
