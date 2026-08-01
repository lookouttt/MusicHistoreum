CREATE OR REPLACE PROCEDURE public."usp_SEL_ChartEntriesByChart"(IN req_chart_id integer DEFAULT 1)
 LANGUAGE sql
AS $procedure$
select chart_entries.entry_id, chart_entries.song_id, chart_entries.song_rank, chart_dates.chart_date 
from chart_entries join chart_dates
on chart_entries.chart_id = chart_dates.chart_date_id
where chart_dates.chart_id = req_chart_id
order by chart_dates.chart_date desc, song_rank
$procedure$
;
