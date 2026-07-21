# iTunes BPM Tagger (standalone PowerShell script)

## Context

The user wants to look up beats-per-minute (tempo) for songs in their local classic-iTunes library and write it back into iTunes' own BPM field (which they've confirmed they can already edit manually, even for Apple Music-sourced tracks). Apple's Music API has no tempo attribute and no way to write custom metadata back to a library — so this can't be built on top of the Apple Music playlist feature we already shipped. It's a separate, standalone local automation task: a PowerShell script that talks to classic iTunes via its COM automation interface and to GetSongBPM.com's lookup API, unrelated to the client/server web app.

Confirmed with the user:
- BPM source: **GetSongBPM.com**'s free API (title+artist → tempo).
- Already-tagged tracks (`BPM` already set) should be **skipped**, not overwritten.
- They're running **classic iTunes** for Windows (not the newer Microsoft Store "Apple Music" app) — required, since only classic iTunes registers the `iTunes.Application` COM interface this script depends on.

This is greenfield — confirmed via repo search that nothing here currently touches iTunes, COM, or BPM/tempo. The closest structural precedent is `bb_script/bb_scrape.py` (a standalone script living outside `client/`/`server/`, flat top-level logic, `logging` to a local file, narrow catch blocks for expected failures vs. logging-and-continuing on unexpected ones, plain sleep-based rate limiting) — reused for style, **except** its hardcoded-inline-credential/no-gitignore handling, which CLAUDE.md and `docs/remaining-audit-items.md` already flag as a defect, not a pattern to repeat. The server's `dotenv`/`.env`+`.gitignore` approach is the better model for secret-handling, ported to this script as an env-var/parameter instead of a hardcoded value.

## New files

- `itunes_bpm_tagger/Set-ItunesBpm.ps1` — the script.
- `itunes_bpm_tagger/.gitignore` — ignores `bpm_tagging.log` (mirrors the root `.gitignore`'s handling of `bb_script/billboard.log`).

No API key ever lives in a tracked file: the script takes `-ApiKey`, falling back to `$env:GETSONGBPM_API_KEY` if omitted.

## Script parameters

```
-ApiKey       (string, optional — falls back to $env:GETSONGBPM_API_KEY; error out with setup instructions if neither is set)
-ApiDomain    (string, default 'api.getsongbpm.com' — GetSongBPM's own docs page was inaccessible during research due to bot-blocking, and two domains show up across credible sources for this API. Default to api.getsongbpm.com per the more recent working client + current Perl CPAN module; expose this as a parameter so switching to api.getsong.co is a one-flag retry if the default doesn't work once a real key is in hand.)
-DryRun       (switch — look up and log what WOULD be written without calling put_BPM. Strongly recommended for the first run.)
-MaxTracks    (int, optional — cap how many tracks are processed, for a quick sanity-check run before a full library pass)
-DelayMs      (int, default 300 — pause between API calls; GetSongBPM publishes no documented rate limit, so this is a conservative default, not a measured one)
```

## Flow

1. Resolve the API key (`-ApiKey` or env var); if missing, exit with a clear message pointing to https://getsongbpm.com/api to register (free, requires an email; note their terms require attribution/backlink if this data is ever surfaced publicly — not applicable for this private local script, but worth the user knowing).
2. Open a log file at `itunes_bpm_tagger/bpm_tagging.log` (append mode) via a small `Write-Log` helper — timestamped lines, mirroring `bb_scrape.py`'s "log important events to a local file" convention.
3. Connect to iTunes: `$itunes = New-Object -ComObject iTunes.Application` in a try/catch (this call auto-launches iTunes if it isn't running — expected, not an error). On failure, log and exit — likely means classic iTunes isn't installed.
4. Enumerate `$itunes.LibraryPlaylist.Tracks`, filtering to `Kind` values `1` (`ITTrackKindFile`) or `2` (`ITTrackKindCD`) — confirmed via Apple's own iTunes COM SDK header (`IITTrack.Kind`/`ITTrackKind` enum) as the two kinds representing real playable file/CD tracks with a settable `BPM`; this excludes `URL`/`Device`/`SharedLibrary` entries that aren't meaningful BPM-tagging targets.
5. For each qualifying track, in order:
   - Skip if `$track.BPM -gt 0` (already tagged) — increment a skip counter, no per-track log line (avoids log spam; only the run summary reports the skip count).
   - Stop early if `-MaxTracks` reached.
   - Search GetSongBPM: `GET https://$ApiDomain/search/?api_key=$ApiKey&type=song&lookup=<title> <artist>` (URL-encoded). Parse the `search` array of candidates.
   - Apply an artist-match filter across candidates — port the same heuristic already built and proven in `client/src/features/appleMusicPlaylist/songMatcher.js` for the Apple Music playlist feature: normalize (lowercase, strip punctuation), then if the full strings don't contain each other, fall back to comparing just the "primary artist" (text before "Featuring"/"&"/"with"/"x"/"vs"/etc.) — this handles Billboard-style multi-artist credits the same way it did there.
   - For the first artist-matching candidate, call `GET https://$ApiDomain/song/?api_key=$ApiKey&id=<id>` to fetch the `tempo` field (confirmed via a concrete documented example that `tempo` lives on the `/song/` detail response as a numeric string, e.g. `"220"` — search-result entries were not confirmed to reliably include it, so this second call is the safe design even though it doubles request volume per track; mitigated by `-DelayMs` and non-hammering intent).
   - Round `tempo` to the nearest integer. If `-DryRun`, log "would set BPM=X for <title> — <artist>" and don't write; otherwise `$track.BPM = [int]$roundedTempo` and log "set BPM=X".
   - No match / API error for this track → log as unmatched/error and continue to the next track (matches `bb_scrape.py`'s "log and move on" resilience pattern — never abort the whole run over one track).
   - If a response looks like an auth failure (401/403), treat it as fatal — log and abort the entire run immediately rather than repeating the same failure per track (this is a setup problem, not a per-track miss).
   - `Start-Sleep -Milliseconds $DelayMs` between API calls.
6. After the loop: log and print a summary (tracks scanned, skipped-already-tagged, BPM set, not-found, errors), then release the COM object per the documented cleanup pattern (`[System.Runtime.InteropServices.Marshal]::ReleaseComObject($itunes)`, `Remove-Variable itunes`, `[gc]::Collect()`) so the iTunes helper process doesn't linger.

## Known unknowns to verify empirically (flagged by research, not blocking the build)

- **Which GetSongBPM domain is actually live** — the official docs page was inaccessible (bot-blocked) during research; both `api.getsongbpm.com` and `api.getsong.co` appear in credible but conflicting sources. Defaulted to `api.getsongbpm.com`; `-ApiDomain` makes switching a one-flag retry.
- **Whether an unset iTunes `BPM` truly reads as `0`** — inferred from the property being a plain COM `long` with no null option, not from an explicit Apple statement. The first `-DryRun` pass will surface this immediately (dry-run output will look wrong if the assumption is off).
- **Undocumented GetSongBPM rate limits** — handled defensively with `-DelayMs` and by treating repeated failures as fatal rather than hammering.

## Verification

1. First run: `.\Set-ItunesBpm.ps1 -ApiKey <key> -DryRun -MaxTracks 5` — confirms iTunes COM connects, the API domain/key work, and the artist-matching/tempo-parsing logic looks right on a handful of tracks before touching real data.
2. Spot-check 2-3 of the dry-run's proposed BPM values against GetSongBPM.com's own website search, to sanity-check match quality.
3. Re-run without `-DryRun`/`-MaxTracks` for the full library; check the summary counts in `itunes_bpm_tagger/bpm_tagging.log`, and confirm a few tagged tracks' BPM directly in iTunes' UI (Get Info → Options tab).
4. If most/all lookups fail outright, retry once with `-ApiDomain api.getsong.co` before assuming something else is wrong.
