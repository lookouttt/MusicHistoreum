CREATE OR REPLACE FUNCTION public.get_range_album_chart(range_chart_id integer, range_start_date date, range_end_date date)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
declare
	selectedalbum record;
	chartedAlbums record;
	myPoints integer := 0;
	bonusPoints integer := 0;
	pointFactor integer;
	albumCount integer := 0;
	albumId integer := 0;
	currentChart integer;
	startDate date;
	endDate date;
	total_days decimal;
	total_years decimal;
	jsonResponse JSON;
begin

	create temporary table RangeChart
	(
		album_id int not null,
		album_title varchar(200) not null,
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
	total_days = endDate - startDate;
	total_years = total_days/7;
	
	for chartedAlbums in select album_list.album_id as album_id, album_list.album_title, artist_list.artist_name, min(chart_entries.rank) as peak, min(chart_dates.chart_date) as first_date, max(chart_dates.chart_date) as last_date,sum(101 - chart_entries.rank) as points, count(chart_entries.rank) as weeks
	from album_list join artist_list on album_list.artist_id = artist_list.artist_id
	join chart_entries on album_list.album_id = chart_entries.source_id
	join chart_dates on chart_entries.chart_id = chart_dates.chart_date_id
	join chart_list on chart_list.chart_id = chart_dates.chart_id
	where chart_dates.chart_date >= startDate and chart_dates.chart_date <= endDate and chart_list.chart_id = currentChart
	group by album_list.album_id, artist_list.artist_name
	order by first_date, album_list.album_id
	loop
		albumId = chartedAlbums.album_id;
		for selectedAlbum in
		select row_number() over (order by chart_date) sequence_no, chart_entries.source_id as album_id, chart_entries.rank as album_rank, chart_dates.chart_date as chart_date, chart_dates.item_count as total_albums, album_list.album_title as album_title, artist_list.artist_name as artist_name from chart_entries
		join chart_dates on chart_entries.chart_id = chart_dates.chart_date_id
		join album_list on chart_entries.source_id = album_list.album_id
		join artist_list on album_list.artist_id = artist_list.artist_id
		where chart_dates.chart_id = currentChart and chart_dates.chart_date >= chartedAlbums.first_date and chart_dates.chart_date <= chartedAlbums.last_date
		and album_list.album_id = albumId
		order by chart_dates.chart_date, chart_entries.rank
			loop
				if selectedAlbum.total_albums >= 150 then
					pointFactor = 1;
				elsif selectedAlbum.total_albums >= 100 then
					pointFactor = 0.6;
				else
					pointFactor = 0.4;
				end if;

				myPoints = myPoints + ((selectedAlbum.total_albums + 1) - selectedAlbum.album_rank);
				if selectedAlbum.album_rank <= 10 then
					myPoints = myPoints + (11-selectedAlbum.album_rank)*10*pointFactor;
					bonusPoints = bonusPoints + (11-selectedAlbum.album_rank)*10*pointFactor;
				end if;

				albumCount = albumCount + 1;
				if albumCount >= 30*total_years and albumCount < 35*total_years then
					myPoints = myPoints + 5*pointFactor;
					bonusPoints = bonusPoints + 5;
				elsif albumCount >= 35*total_years and albumCount < 40*total_years then
					myPoints = myPoints + 10*pointFactor;
					bonusPoints = bonusPoints + 10;
				elsif albumCount >= 40*total_years and albumCount < 45*total_years then
					myPoints = myPoints + 15*pointFactor;
					bonusPoints = bonusPoints + 15;
				elsif albumCount >= 45*total_years and albumCount < 50*total_years then
					myPoints = myPoints + 20*pointFactor;
					bonusPoints = bonusPoints + 20;
				elsif albumCount >= 50*total_years then
					myPoints = myPoints + 25*pointFactor;
					bonusPoints = bonusPoints + 25;
				end if;
			end loop;

		--raise notice '% - % - % - % - %', albumId, selectedAlbum.album_rank, myPoints, bonusPoints, albumCount;
		insert into RangeChart(album_id, album_title, artist_name, peak, first_date, last_date, points, weeks)
		values(albumId, selectedAlbum.album_title, selectedAlbum.artist_name, chartedAlbums.peak, chartedAlbums.first_date, chartedAlbums.last_date, myPoints, albumCount);
		myPoints = 0;
		bonusPoints = 0;
		albumCount = 0;
	end loop;

	select array_to_json(array_agg(row_to_json(t))) into jsonResponse from (
	SELECT  row_number() over (order by RangeChart.points desc, RangeChart.peak asc, RangeChart.weeks desc) album_rank, * from RangeChart
	order by RangeChart.points desc, RangeChart.peak asc, RangeChart.weeks desc) t;
	
	drop table RangeChart;
	return jsonResponse;
	
end;
$function$
;
