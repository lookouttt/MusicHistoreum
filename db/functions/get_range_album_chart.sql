CREATE OR REPLACE FUNCTION public.get_range_album_chart(range_chart_id integer, range_start_date date, range_end_date date)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
declare
	total_days   decimal;
	total_years  decimal;
	jsonResponse JSON;
begin
	-- See the note in get_range_song_chart about pointFactor: the original
	-- declared it `integer`, so 0.6 rounded to 1 and 0.4 rounded to 0.
	-- The album thresholds are 150 / 100 (not 75 / 50 as for songs).
	--
	-- total_years is also carried over verbatim from the original: it is
	-- (end - start) in DAYS divided by 7, i.e. really a count of weeks, and the
	-- milestone thresholds below are multiples of it.
	total_days  = range_end_date - range_start_date;
	total_years = total_days / 7;

	select array_to_json(array_agg(row_to_json(t))) into jsonResponse
	from (
		-- album_id is only a deterministic tie-breaker; see the note in
		-- get_range_song_chart.  The first three sort keys are unchanged.
		select row_number() over (order by points desc, peak asc, weeks desc, album_id asc) as album_rank,
		       album_id, album_title, artist_name, peak, first_date, last_date, points, weeks
		from (
			select album_id,
			       album_title,
			       artist_name,
			       min(album_rank)     as peak,
			       min(chart_date)     as first_date,
			       max(chart_date)     as last_date,
			       sum(
			             ((total_albums + 1) - album_rank)
			           + case when album_rank <= 10
			                       then (11 - album_rank) * 10 * point_factor
			                  else 0
			             end
			           + case when occurrence_no >= 30 * total_years and occurrence_no < 35 * total_years then  5 * point_factor
			                  when occurrence_no >= 35 * total_years and occurrence_no < 40 * total_years then 10 * point_factor
			                  when occurrence_no >= 40 * total_years and occurrence_no < 45 * total_years then 15 * point_factor
			                  when occurrence_no >= 45 * total_years and occurrence_no < 50 * total_years then 20 * point_factor
			                  when occurrence_no >= 50 * total_years                                      then 25 * point_factor
			                  else 0
			             end
			           )::int           as points,
			       count(*)::int        as weeks
			from (
				select chart_entries.source_id   as album_id,
				       album_list.album_title    as album_title,
				       artist_list.artist_name   as artist_name,
				       chart_entries.rank        as album_rank,
				       chart_dates.chart_date    as chart_date,
				       chart_dates.item_count    as total_albums,
				       case when chart_dates.item_count >= 150 then 1  -- was pointFactor = 1
				            when chart_dates.item_count >= 100 then 1  -- was pointFactor = 0.6 -> rounds to 1
				            else 0                                     -- was pointFactor = 0.4 -> rounds to 0
				       end                       as point_factor,
				       row_number() over (partition by chart_entries.source_id
				                          order by chart_dates.chart_date, chart_entries.rank)
				                                 as occurrence_no
				from chart_entries
				join chart_dates on chart_entries.chart_id = chart_dates.chart_date_id
				join album_list  on chart_entries.source_id = album_list.album_id
				join artist_list on album_list.artist_id = artist_list.artist_id
				join chart_list  on chart_list.chart_id = chart_dates.chart_id
				where chart_dates.chart_date >= range_start_date
				  and chart_dates.chart_date <= range_end_date
				  and chart_list.chart_id = range_chart_id
			) e
			group by album_id, album_title, artist_name
		) s
		order by points desc, peak asc, weeks desc, album_id asc
	) t;

	return jsonResponse;
end;
$function$
;
