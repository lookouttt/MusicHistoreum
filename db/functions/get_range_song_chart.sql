CREATE OR REPLACE FUNCTION public.get_range_song_chart(range_chart_id integer, range_start_date date, range_end_date date)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
declare
	selectedSong record;
	chartedSongs record;
	myPoints integer := 0;
	bonusPoints integer := 0;
	pointFactor integer;
	songCount integer := 0;
	songId integer := 0;
	currentChart integer;
	startDate date;
	endDate date;
	jsonResponse JSON;	
begin

	create temporary table RangeChart
	(
		song_id int not null,
		song_title varchar(200) not null,
		artist_name varchar(200) not null,
		peak int not null,
		first_date date not null,
		last_date date not null,
		points int not null,
		weeks int not null
	);
	
	currentChart = range_chart_id;
	startDate = range_start_date;
	endDate = range_end_date;
	
	for chartedSongs in select song_list.song_id as song_id, song_list.song_title, artist_list.artist_name, min(chart_entries.rank) as peak, min(chart_dates.chart_date) as first_date, max(chart_dates.chart_date) as last_date,sum(101 - chart_entries.rank) as points, count(chart_entries.rank) as weeks
	from song_list join artist_list on song_list.artist_id = artist_list.artist_id
	join chart_entries on song_list.song_id = chart_entries.source_id
	join chart_dates on chart_entries.chart_id = chart_dates.chart_date_id
	join chart_list on chart_list.chart_id = chart_dates.chart_id
	where chart_dates.chart_date >= startDate and chart_dates.chart_date <= endDate and chart_list.chart_id = currentChart
	group by song_list.song_id, artist_list.artist_name
	order by first_date, song_list.song_id
	loop
		songId = chartedSongs.song_id;
		for selectedSong in
		select row_number() over (order by chart_date) sequence_no, chart_entries.source_id as song_id, chart_entries.rank as song_rank, chart_dates.chart_date as chart_date, chart_dates.item_count as total_songs, song_list.song_title as song_title, artist_list.artist_name as artist_name from chart_entries
		join chart_dates on chart_entries.chart_id = chart_dates.chart_date_id
		join song_list on chart_entries.source_id = song_list.song_id
		join artist_list on song_list.artist_id = artist_list.artist_id
		where chart_dates.chart_id = currentChart and chart_dates.chart_date >= chartedSongs.first_date and chart_dates.chart_date <= chartedSongs.last_date
		and song_list.song_id = songId
		order by chart_dates.chart_date, chart_entries.rank
		loop
			if selectedSong.total_songs >= 75 then
				pointFactor = 1;
			elsif selectedSong.total_songs >= 50 then
				pointFactor = 0.6;
			else
				pointFactor = 0.4;
			end if;

			myPoints = myPoints + ((selectedSong.total_songs + 1) - selectedSong.song_rank);
			if selectedSong.song_rank <= 10 then
				myPoints = myPoints + (11-selectedSong.song_rank)*10*pointFactor;
				bonusPoints = bonusPoints + (11-selectedSong.song_rank)*10*pointFactor;
			end if;

			songCount = songCount + 1;
			if songCount >= 20 and songCount < 25 then
				myPoints = myPoints + 5*pointFactor;
				bonusPoints = bonusPoints + 5;
			elsif songCount >= 25 and songCount < 30 then
				myPoints = myPoints + 10*pointFactor;
				bonusPoints = bonusPoints + 10;
			elsif songCount >= 30 and songCount < 35 then
				myPoints = myPoints + 15*pointFactor;
				bonusPoints = bonusPoints + 15;
			elsif songCount >= 35 and songCount < 40 then
				myPoints = myPoints + 20*pointFactor;
				bonusPoints = bonusPoints + 20;
			elsif songCount >= 40 then
				myPoints = myPoints + 25*pointFactor;
				bonusPoints = bonusPoints + 25;
			end if;
		end loop;

		--raise notice '% - % - % - % - %', songId, selectedSong.song_rank, myPoints, bonusPoints, songCount;
		insert into RangeChart(song_id, song_title, artist_name, peak, first_date, last_date, points, weeks)
		values(songId, selectedSong.song_title, selectedSong.artist_name, chartedSongs.peak, chartedSongs.first_date, chartedSongs.last_date, myPoints, songCount);
		myPoints = 0;
		bonusPoints = 0;
		songCount = 0;
	end loop;

	select array_to_json(array_agg(row_to_json(t))) into jsonResponse from (
	SELECT  row_number() over (order by RangeChart.points desc, RangeChart.peak asc, RangeChart.weeks desc) song_rank, * from RangeChart
	order by RangeChart.points desc, RangeChart.peak asc, RangeChart.weeks desc) t;
	
	drop table RangeChart;
	return jsonResponse;
	
end;
$function$
;
