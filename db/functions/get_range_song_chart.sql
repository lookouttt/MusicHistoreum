CREATE OR REPLACE FUNCTION public.get_range_song_chart(range_chart_id integer, range_start_date date, range_end_date date)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
declare
	jsonResponse JSON;
begin
	-- NOTE ON pointFactor: the original row-by-row implementation declared
	--   pointFactor integer;
	-- and then assigned 1 / 0.6 / 0.4 to it.  Assigning a numeric literal to an
	-- integer variable rounds, so 0.6 became 1 and 0.4 became 0.  The CASE below
	-- reproduces that exact (buggy-looking but load-bearing) behaviour: the
	-- >= 75 and >= 50 arms both yield 1, and everything else -- including a NULL
	-- item_count -- yields 0.

	select array_to_json(array_agg(row_to_json(t))) into jsonResponse
	from (
		-- song_id is only a deterministic tie-breaker: (points, peak, weeks) can leave
		-- rows fully tied, and without a unique last key the rank a tied row receives
		-- depends on the query plan.  annual_top_songs.py persists song_rank and cuts
		-- at song_rank <= top_n, so an unstable rank would churn stored rankings and
		-- could swap which tied song makes the cut.  The first three keys, and the
		-- points they order by, are unchanged from the original implementation.
		select row_number() over (order by points desc, peak asc, weeks desc, song_id asc) as song_rank,
		       song_id, song_title, artist_name, peak, first_date, last_date, points, weeks
		from (
			select song_id,
			       song_title,
			       artist_name,
			       min(song_rank)      as peak,
			       min(chart_date)     as first_date,
			       max(chart_date)     as last_date,
			       sum(
			             ((total_songs + 1) - song_rank)
			           + case when song_rank <= 10
			                       then (11 - song_rank) * 10 * point_factor
			                  else 0
			             end
			           + case when occurrence_no >= 20 and occurrence_no < 25 then  5 * point_factor
			                  when occurrence_no >= 25 and occurrence_no < 30 then 10 * point_factor
			                  when occurrence_no >= 30 and occurrence_no < 35 then 15 * point_factor
			                  when occurrence_no >= 35 and occurrence_no < 40 then 20 * point_factor
			                  when occurrence_no >= 40                        then 25 * point_factor
			                  else 0
			             end
			           )::int           as points,
			       count(*)::int        as weeks
			from (
				select chart_entries.source_id   as song_id,
				       song_list.song_title      as song_title,
				       artist_list.artist_name   as artist_name,
				       chart_entries.rank        as song_rank,
				       chart_dates.chart_date    as chart_date,
				       chart_dates.item_count    as total_songs,
				       case when chart_dates.item_count >= 75 then 1   -- was pointFactor = 1
				            when chart_dates.item_count >= 50 then 1   -- was pointFactor = 0.6 -> rounds to 1
				            else 0                                     -- was pointFactor = 0.4 -> rounds to 0
				       end                       as point_factor,
				       row_number() over (partition by chart_entries.source_id
				                          order by chart_dates.chart_date, chart_entries.rank)
				                                 as occurrence_no
				from chart_entries
				join chart_dates on chart_entries.chart_id = chart_dates.chart_date_id
				join song_list   on chart_entries.source_id = song_list.song_id
				join artist_list on song_list.artist_id = artist_list.artist_id
				join chart_list  on chart_list.chart_id = chart_dates.chart_id
				where chart_dates.chart_date >= range_start_date
				  and chart_dates.chart_date <= range_end_date
				  and chart_list.chart_id = range_chart_id
			) e
			group by song_id, song_title, artist_name
		) s
		order by points desc, peak asc, weeks desc, song_id asc
	) t;

	return jsonResponse;
end;
$function$
;
