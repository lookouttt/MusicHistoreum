# Chart Coverage

Every chart in the `chart_list` table, and where each one stands relative to Billboard.com. Snapshot taken from the Aiven database on 2026-08-01 (see `db/tables/chart_list.sql`). The "On Billboard.com" column comes from a live sweep the same day, querying each chart slug directly via the `billboard` Python library (10s between requests, matching `bb_scrape.py`'s own politeness convention).

- **Collecting** — `included = true`: `bb_scrape.py` actively scrapes new data for it.
- **Live** — `included = true` AND `online = true`: also served by the API (`GET /chartList`) and shown on musichistoreum.com.
- **Not tracked** — neither flag set: not currently scraped or shown.
- **On Billboard.com** — Yes / No (404, chart page doesn't exist) / Unknown (request timed out; inconclusive, not confirmed inactive — see note below).

**Totals:** 177 charts known &middot; 64 collecting &middot; 11 live &middot; 143 confirmed still on Billboard.com &middot; 24 confirmed gone &middot; 10 unknown.

| Chart | Type | Status | Last Updated | On Billboard.com |
|---|---|---|---|---|
| adult-contemporary | Song | Live | 2026-07-18 | Yes |
| adult-pop-songs | Song | Collecting | 2026-07-18 | Yes |
| alternative-airplay | Song | Live | 2025-07-12 | Yes |
| alternative-albums | Album | Live | 2025-07-12 | Yes |
| alternative-digital-song-sales | Song | Collecting | 2025-07-12 | Yes |
| alternative-streaming-songs | Song | Collecting | 2025-07-12 | Yes |
| americana-folk-albums | Album | Collecting | 2026-07-18 | Yes |
| artist-100 | Artist | Not tracked | — | Yes |
| australia-digital-song-sales | Song | Not tracked | — | Yes |
| australian-albums | Album | Not tracked | — | Yes |
| billboard-200 | Album | Live | 2026-07-11 | Yes |
| billboard-argentina-hot-100 | Song | Not tracked | — | Yes |
| billboard-global-200 | Song | Collecting | 2026-07-18 | Yes |
| billboard-global-excl-us | Song | Collecting | 2026-07-11 | Yes |
| billboard-korea-100 | Song | Not tracked | — | No (404) |
| bluegrass-albums | Album | Not tracked | — | Yes |
| blues-albums | Album | Collecting | 2023-03-11 | Yes |
| bubbling-under-hot-100-singles | Song | Collecting | 2023-03-11 | Yes |
| canada-ac | Song | Not tracked | — | No (404) |
| canada-all-format-airplay | Song | Not tracked | — | No (404) |
| canada-chr-top-40 | Song | Not tracked | — | No (404) |
| canada-country | Song | Not tracked | — | No (404) |
| canada-emerging-artists | Artist | Not tracked | — | Yes |
| canada-hot-ac | Song | Not tracked | — | No (404) |
| canada-rock | Song | Not tracked | — | No (404) |
| canadian-albums | Album | Not tracked | — | Yes |
| canadian-hot-100 | Song | Not tracked | — | Yes |
| cast-albums | Album | Not tracked | — | Yes |
| catalog-albums | Album | Collecting | 2025-07-12 | Yes |
| christian-airplay | Song | Collecting | 2023-03-11 | Yes |
| christian-albums | Album | Collecting | 2023-03-11 | Yes |
| christian-digital-song-sales | Song | Collecting | 2023-03-11 | No (404) |
| christian-songs | Song | Collecting | 2023-03-11 | Yes |
| christian-streaming-songs | Song | Collecting | 2023-03-11 | Yes |
| classical-albums | Album | Not tracked | — | Yes |
| classical-crossover-albums | Album | Not tracked | — | Yes |
| comedy-albums | Album | Not tracked | — | Yes |
| compilation-albums | Album | Not tracked | — | Yes |
| contemporary-jazz | Album | Collecting | 2023-03-11 | Yes |
| country-airplay | Song | Collecting | 2026-07-18 | Yes |
| country-albums | Album | Live | 2026-07-18 | Yes |
| country-digital-song-sales | Song | Collecting | 2025-07-12 | No (404) |
| country-songs | Song | Live | 2026-07-18 | Yes |
| country-streaming-songs | Song | Collecting | 2026-07-18 | Yes |
| current-albums | Album | Collecting | 2025-07-12 | Yes |
| dance-club-play-songs | Song | Collecting | 2020-03-28 | Yes |
| dance-electronic-albums | Album | Not tracked | — | Yes |
| dance-electronic-digital-song-sales | Song | Not tracked | — | No (404) |
| dance-electronic-songs | Song | Not tracked | — | Yes |
| dance-electronic-streaming-songs | Song | Not tracked | — | Yes |
| digital-song-sales | Song | Collecting | 2026-07-18 | Yes |
| emerging-artists | Artist | Not tracked | — | Yes |
| euro-digital-song-sales | Song | Not tracked | — | Yes |
| france-digital-song-sales | Song | Not tracked | — | Yes |
| german-albums | Album | Not tracked | — | No (404) |
| germany-songs | Song | Not tracked | — | Yes |
| gospel-airplay | Song | Collecting | 2023-03-11 | Yes |
| gospel-albums | Album | Collecting | 2023-03-11 | Yes |
| gospel-digital-song-sales | Song | Collecting | 2023-03-11 | No (404) |
| gospel-songs | Song | Collecting | 2023-03-11 | Yes |
| gospel-streaming-songs | Song | Collecting | 2023-03-11 | Yes |
| greatest-adult-pop-artists | Greatest | Not tracked | — | Yes |
| greatest-adult-pop-songs | Greatest | Not tracked | — | Yes |
| greatest-alternative-artists | Greatest | Not tracked | — | Yes |
| greatest-alternative-songs | Greatest | Not tracked | — | Yes |
| greatest-billboard-200-albums | Greatest | Not tracked | — | Yes |
| greatest-billboard-200-albums-by-women | Greatest | Not tracked | — | Yes |
| greatest-billboard-200-artists | Greatest | Not tracked | — | Yes |
| greatest-billboard-200-women-artists | Greatest | Not tracked | — | Yes |
| greatest-billboards-top-songs-80s | Greatest | Not tracked | — | Yes |
| greatest-billboards-top-songs-90s | Greatest | Not tracked | — | Unknown (timeout) |
| greatest-country-albums | Greatest | Not tracked | — | Yes |
| greatest-country-artists | Greatest | Not tracked | — | Unknown (timeout) |
| greatest-country-songs | Greatest | Not tracked | — | Unknown (timeout) |
| greatest-hot-100-artists | Greatest | Not tracked | — | Unknown (timeout) |
| greatest-hot-100-singles | Greatest | Not tracked | — | Unknown (timeout) |
| greatest-hot-100-songs-by-women | Greatest | Not tracked | — | Unknown (timeout) |
| greatest-hot-100-women-artists | Greatest | Not tracked | — | Yes |
| greatest-hot-latin-songs | Greatest | Not tracked | — | Yes |
| greatest-hot-latin-songs-artists | Greatest | Not tracked | — | Yes |
| greatest-of-all-time-latin-artists | Greatest | Not tracked | — | Yes |
| greatest-of-all-time-pop-songs | Greatest | Not tracked | — | Unknown (timeout) |
| greatest-of-all-time-pop-songs-artists | Greatest | Not tracked | — | Yes |
| greatest-r-b-hip-hop-albums | Greatest | Not tracked | — | Yes |
| greatest-r-b-hip-hop-artists | Greatest | Not tracked | — | Unknown (timeout) |
| greatest-r-b-hip-hop-songs | Greatest | Not tracked | — | Unknown (timeout) |
| greatest-top-dance-club-artists | Greatest | Not tracked | — | Unknown (timeout) |
| greece-albums | Album | Not tracked | — | Yes |
| hard-rock-albums | Album | Collecting | 2025-07-12 | Yes |
| hard-rock-digital-song-sales | Song | Collecting | 2025-07-12 | Yes |
| hard-rock-streaming-songs | Song | Collecting | 2025-07-12 | Yes |
| heatseekers-albums | Album | Collecting | 2023-03-11 | No (404) |
| holiday-albums | Album | Not tracked | — | Yes |
| holiday-season-digital-song-sales | Song | Not tracked | — | No (404) |
| holiday-songs | Song | Not tracked | — | Yes |
| holiday-streaming-songs | Song | Not tracked | — | Yes |
| hot-100 | Song | Live | 2026-07-18 | Yes |
| hot-adult-r-and-b-airplay | Song | Collecting | 2023-03-11 | Yes |
| hot-alternative-songs | Song | Collecting | 2025-07-12 | Yes |
| hot-canada-digital-song-sales | Song | Not tracked | — | No (404) |
| hot-christian-adult-contemporary | Song | Collecting | 2023-03-11 | Yes |
| hot-dance-airplay | Song | Not tracked | — | Yes |
| hot-hard-rock-songs | Song | Collecting | 2025-07-12 | Yes |
| hot-holiday-songs | Song | Not tracked | — | Yes |
| hot-mainstream-rock-tracks | Song | Live | 2025-07-12 | Yes |
| hot-r-and-b-hip-hop-airplay | Song | Not tracked | — | Yes |
| hot-rap-tracks | Song | Not tracked | — | Yes |
| hot-singles-recurrents | Song | Collecting | 2023-03-11 | No (404) |
| independent-albums | Album | Collecting | 2026-07-18 | Yes |
| italy-albums | Album | Not tracked | — | Yes |
| italy-digital-song-sales | Song | Not tracked | — | Yes |
| japan-hot-100 | Song | Not tracked | — | Yes |
| jazz-albums | Album | Collecting | 2023-03-11 | Yes |
| jazz-songs | Song | Collecting | 2023-03-11 | Yes |
| kids-albums | Album | Not tracked | — | Yes |
| latin-airplay | Song | Not tracked | — | Yes |
| latin-albums | Album | Not tracked | — | Yes |
| latin-digital-song-sales | Song | Not tracked | — | No (404) |
| latin-pop-airplay | Song | Not tracked | — | Yes |
| latin-pop-albums | Album | Not tracked | — | Yes |
| latin-regional-mexican-airplay | Song | Not tracked | — | Yes |
| latin-rhythm-airplay | Song | Not tracked | — | Yes |
| latin-rhythm-albums | Album | Not tracked | — | Yes |
| latin-songs | Song | Not tracked | — | Yes |
| latin-streaming-songs | Song | Not tracked | — | Yes |
| latin-tropical-airplay | Song | Not tracked | — | Yes |
| lyricfind-global | Song | Not tracked | — | Yes |
| lyricfind-us | Song | Not tracked | — | Yes |
| mainstream-r-and-b-hip-hop | Song | Collecting | 2023-03-11 | Yes |
| mexico | Song | Not tracked | — | Yes |
| mexico-espanol | Song | Not tracked | — | Yes |
| mexico-ingles | Song | Not tracked | — | Yes |
| mexico-popular | Song | Not tracked | — | Yes |
| new-age-albums | Album | Not tracked | — | Yes |
| next-big-sound-25 | Artist | Not tracked | — | Yes |
| official-uk-albums | Album | Not tracked | — | Yes |
| official-uk-songs | Song | Not tracked | — | Yes |
| pop-songs | Song | Collecting | 2026-07-18 | Yes |
| radio-songs | Song | Collecting | 2026-07-18 | Yes |
| r-and-b-albums | Album | Not tracked | — | Yes |
| r-and-b-digital-song-sales | Song | Not tracked | — | No (404) |
| r-and-b-hip-hop-digital-song-sales | Song | Collecting | 2025-07-12 | No (404) |
| r-and-b-hip-hop-streaming-songs | Song | Not tracked | — | Yes |
| r-and-b-songs | Song | Not tracked | — | Yes |
| r-and-b-streaming-songs | Song | Collecting | 2023-05-06 | Yes |
| rap-albums | Album | Not tracked | — | Yes |
| rap-digital-song-sales | Song | Not tracked | — | No (404) |
| rap-song | Song | Not tracked | — | Yes |
| rap-streaming-songs | Song | Not tracked | — | Yes |
| r-b-hip-hop-albums | Album | Live | 2025-07-12 | Yes |
| r-b-hip-hop-songs | Song | Live | 2025-07-12 | Yes |
| reggae-albums | Album | Not tracked | — | Yes |
| regional-mexican-albums | Album | Not tracked | — | Yes |
| rhythmic-40 | Song | Not tracked | — | Yes |
| rock-airplay | Song | Collecting | 2025-07-12 | Yes |
| rock-albums | Album | Live | 2026-02-14 | Yes |
| rock-digital-song-sales | Song | Collecting | 2025-07-12 | No (404) |
| rock-songs | Song | Collecting | 2026-07-18 | Yes |
| rock-streaming-songs | Song | Collecting | 2025-07-12 | Yes |
| social-50 | Artist | Not tracked | — | Yes |
| soundtracks | Album | Not tracked | — | Yes |
| spain-digital-song-sales | Song | Not tracked | — | Yes |
| streaming-songs | Song | Collecting | 2026-07-18 | Yes |
| summer-songs | Song | Not tracked | — | Yes |
| switzerland-digital-song-sales | Song | Not tracked | — | Yes |
| tastemaker-albums | Album | Collecting | 2023-03-11 | Yes |
| top-album-sales | Album | Collecting | 2026-07-18 | Yes |
| top-triller-global | Song | Not tracked | — | No (404) |
| top-triller-us | Song | Not tracked | — | No (404) |
| traditional-classic-albums | Album | Not tracked | — | Yes |
| traditional-jazz-albums | Album | Collecting | 2023-03-11 | Yes |
| triple-a | Song | Collecting | 2025-07-12 | Yes |
| tropical-albums | Album | Not tracked | — | Yes |
| uk-digital-song-sales | Song | Not tracked | — | Yes |
| vinyl-albums | Album | Collecting | 2026-07-18 | Yes |
| world-albums | Album | Not tracked | — | Yes |
| world-digital-song-sales | Song | Not tracked | — | No (404) |

## Not currently tracked, by category

Most "Not tracked" charts fall into a few clear groups rather than being random gaps:

- **International/regional charts** — Canada, Latin America/Mexico, UK, Germany, Italy, Japan, Korea, Australia, France, Spain, Switzerland, Greece. Most of these are confirmed still live on Billboard.com (untracked by choice, not because they're gone) — the exception is most of the Canada sub-charts (`canada-ac`, `canada-all-format-airplay`, `canada-chr-top-40`, `canada-country`, `canada-hot-ac`, `canada-rock`), all confirmed 404 — Billboard appears to have dropped these specifically, while `canadian-albums`/`canadian-hot-100` remain.
- **"Greatest of All Time" charts** — all 26 are untracked; these are retrospective/all-time rankings rather than recurring weekly charts. 10 of the 26 timed out during the live check rather than resolving cleanly (see below) — a real cluster, not scattered noise.
- **Artist charts** — `artist-100`, `social-50`, `emerging-artists`, `canada-emerging-artists`, `next-big-sound-25` (chart type `Artist`, not `Song`/`Album`). All confirmed still live.
- **Genre/niche charts** — classical, holiday/Christmas, Latin sub-genres, dance/electronic, rap sub-charts, kids, comedy, cast albums, etc. Mostly still live.

## Confirmed gone from Billboard.com (24)

These returned a 404 during the live check — Billboard no longer publishes a page at that slug. Notably, an entire **"-digital-song-sales" sub-chart family** appears to have been discontinued (christian, country, dance-electronic, gospel, r-and-b, r-and-b-hip-hop, rap, rock, plus `latin-digital-song-sales`), alongside most of the Canada-specific charts and both Triller charts:

`billboard-korea-100`, `canada-ac`, `canada-all-format-airplay`, `canada-chr-top-40`, `canada-country`, `canada-hot-ac`, `canada-rock`, `christian-digital-song-sales`, `country-digital-song-sales`, `dance-electronic-digital-song-sales`, `german-albums`, `gospel-digital-song-sales`, `heatseekers-albums`, `holiday-season-digital-song-sales`, `hot-canada-digital-song-sales`, `hot-singles-recurrents`, `latin-digital-song-sales`, `r-and-b-digital-song-sales`, `r-and-b-hip-hop-digital-song-sales`, `rap-digital-song-sales`, `rock-digital-song-sales`, `top-triller-global`, `top-triller-us`, `world-digital-song-sales`.

Two of these — `heatseekers-albums` and `hot-singles-recurrents` — are currently `included = true` (actively "collecting") despite no longer existing on Billboard.com; `bb_scrape.py` would just be re-confirming stale data or erroring quietly on its next pass for these two.

## Inconclusive: 10 timeouts (all "Greatest" charts)

These requests hung well past `billboard.py`'s own timeout during the live check and were skipped rather than resolved — genuinely unknown, not confirmed gone: `greatest-billboards-top-songs-90s`, `greatest-country-artists`, `greatest-country-songs`, `greatest-hot-100-artists`, `greatest-hot-100-singles`, `greatest-hot-100-songs-by-women`, `greatest-of-all-time-pop-songs`, `greatest-r-b-hip-hop-artists`, `greatest-r-b-hip-hop-songs`, `greatest-top-dance-club-artists`. All ten are "Greatest of All Time" pages specifically; other "Greatest" charts resolved fine, so this looks tied to something about these particular pages rather than a general block (worth a manual browser check if it matters, or a re-run with more spacing).
