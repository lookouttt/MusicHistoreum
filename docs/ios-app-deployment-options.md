# iOS App Deployment Options

The idea under discussion: consolidate Historeum's built-in Apple Music playlist creator (`client/src/features/appleMusicPlaylist/`) with the standalone desktop `PlaylistCreator` tool into one app, and evaluate whether that could reasonably live on an iPhone. (The third local tool, `BpmUpdater`, is out of scope for this — it depends on local iTunes COM access on Windows, which has no phone-deployment equivalent; see the "leave out BPM Updater" discussion this doc grew out of.)

Two other local projects have already solved "get an app onto this phone" in different ways, and both are viable precedents here. This doc lays them out side by side so the choice between "playlist-generator web app" and "full native player" can be made deliberately, later, rather than by default.

## Method A: PWA / "Add to Home Screen"

**Precedent:** `c:\claude\MediaTracker`, a Next.js app hosted on Vercel.

**Mechanism.** Next.js's file-convention PWA support (`src/app/manifest.ts`, `src/app/icon.tsx`, `src/app/apple-icon.tsx`) auto-links a web manifest and icon set into every page's `<head>`. That's the entire mechanism — no native build, no App Store, no code signing. iOS Safari's "Add to Home Screen" reads the manifest and installs the site as a standalone icon (`display: standalone` removes browser chrome, so it looks and feels like an installed app). MediaTracker has no service worker at all — every page is server-rendered live against Postgres, so there's no offline cache to maintain, and none was needed to make the install work.

**Infrastructure required.** A live, reachable server. MediaTracker runs on Vercel with a Neon Postgres backend, auto-deployed on every push to `main`. Historeum already has the direct equivalent: Vercel + Aiven Postgres, already in production.

**Accounts / cost.** None beyond normal hosting. No Apple Developer Program membership is required for the PWA mechanism itself.

**Gotcha worth knowing.** MediaTracker's auth middleware initially caught the manifest and icon routes in its login-redirect logic — Safari would fetch the manifest while logged out, get redirected to the login HTML page instead, fail to parse it as a manifest, and silently produce a broken home-screen icon with no visible error. The fix was explicitly excluding `manifest.webmanifest`, `icon`, and `apple-icon` from the auth route-matcher. Historeum's routes aren't currently auth-gated, so this specific trap likely wouldn't bite — but it's worth remembering if auth is ever added in front of the app.

**Applicability to the playlist app.** This is close to a "mostly free" option here specifically because Historeum already has the hard parts built: MusicKit JS is already running client-side, the developer-token server route already exists (`GET /apple-music/developer-token` in `server/index.js`), and song-matching logic already exists (`client/src/features/appleMusicPlaylist/`). Getting to an installable app would mean adding a manifest + icon set to the existing React client — not building new integration. The ceiling is MusicKit JS's ceiling: catalog search and library/playlist writes, but no native playback engine, queue UI, or background audio.

**Confirmed: no BPM visibility.** MusicKit JS only ever talks to Apple's cloud REST API, which has no BPM field at all. On-device BPM data is exposed through a completely separate, native-only framework (`MediaPlayer`/`MPMediaItem`, see Method B below) that a browser has no access to. This isn't a gap that could be closed later within the PWA approach — it's structurally unreachable from a web app.

## Method B: Native app via TestFlight

**Precedent:** `c:\claude\Quicken`, a native Flutter app.

**Mechanism.** A real native iOS build — not a web wrapper. Since the dev machine is Windows and can't build or sign iOS apps locally, the pipeline runs on a cloud Mac: pushing to `main` and manually starting a workflow on Codemagic (`mac_mini_m2` instance) runs `flutter build ipa --release`, code-signs with an explicit certificate + provisioning profile (Codemagic's automatic "integration" signing was tried first and found to be broken for this account), and uploads the signed build to App Store Connect via an API key. The phone then installs/updates the app through the TestFlight app once Apple finishes processing the build.

**Infrastructure required.** A GitHub-hosted repo, a Codemagic account/workflow (or an equivalent macOS CI runner — there's no way around needing a Mac somewhere in the loop), an App Store Connect API key, and a signing certificate + provisioning profile. **Already proven, not theoretical, for this project:** this entire pipeline was built and used to ship Quicken through TestFlight, so it's a known recipe to repeat rather than new territory. A second app still needs its own App ID/bundle identifier and its own provisioning profile — those are per-app and don't carry over from Quicken — but the Codemagic workflow shape, the App Store Connect API key setup, and the certificate/signing process are already solved.

**Accounts / cost.** A paid Apple Developer Program membership — normally **$99/year** — is required for TestFlight distribution (a free personal-team Apple ID only allows local re-signing that expires every 7 days, with no TestFlight option at all). **Already covered for this project:** the license is already held, so this is a sunk cost already being paid for Quicken, not new spend specific to this app.

**Gotchas worth knowing.**
- TestFlight builds expire after 90 days, requiring periodic rebuilds to keep the app installed.
- The distribution certificate itself expires and has to be renewed and re-uploaded.
- Apple rejects any upload with a duplicate build number, so the build number has to be bumped before every single upload.
- Moving beyond TestFlight beta testers to public App Store distribution is a materially bigger step requiring full App Review and a privacy questionnaire.

**Applicability to the playlist app.** This is the only path that gives access to MusicKit's full native SDK (MusicKit for Swift) — real playback, queueing, background audio, and deeper library access, none of which MusicKit JS exposes. It's the relevant path only if the goal grows from "generate playlists" into "an actual player" (the Marvis Pro comparison raised earlier in this discussion). The cost is real: none of the existing matching/selection logic — Historeum's JS or `PlaylistCreator`'s Python (`apple_music.py`, `selector.py`) — carries over; it would need a from-scratch native rewrite. The iteration loop is also much slower: build → sign → upload → Apple processing → TestFlight install, versus an instant web deploy.

**Confirmed: on-device BPM is readable, via a different framework than MusicKit.** iOS's `MediaPlayer` framework exposes `MPMediaItem.beatsPerMinute` — a completely separate API surface from MusicKit's REST API, with direct access to whatever's already synced into the device's local Music library. This is empirically confirmed, not theoretical: tracks BPM-tagged locally via `BpmUpdater`'s iTunes COM writes, once synced up through iCloud Music Library, show their BPM values on-device in Marvis Pro. A native app for this project could read that same data the same way. (BPM *editing* stays out of scope regardless — see Context above — this is only about a native app being able to *read* BPM values that were already set some other way.)

## Apple Music API constraints (apply to both methods)

These come from `PlaylistCreator`'s own hands-on testing (`c:\claude\PlaylistCreator\apple_music.py`, `CLAUDE.md`), not speculation, and they're structural — they hit MusicKit JS and native MusicKit for Swift equally, since both ultimately call the same Apple Music REST API. Any new project in this space needs to design around these from day one, not discover them later:

- **Add-only, no reorder or delete.** *"There is no delete endpoint anywhere in this API — not for a track, not for a playlist. It's add-only for user library data."* Once tracks are added to a playlist, there's no way to remove, reorder, or otherwise edit it through the API — for either method. A duplicate-named or bad playlist created this way is permanent, which is why `PlaylistCreator` checks for name collisions *before* creating rather than trying to fix anything after.
- **Slow cross-device sync.** A playlist created via the API takes roughly **10–25 minutes** to show up on other devices, confirmed in practice — this is Apple server-side behavior, not something client settings control. (A native, COM-based creation path that synced instantly was built and works, but requires local iTunes/Music.app COM access — desktop-Windows-only, no phone equivalent.)
- **Tracks must already be in iCloud Music Library to be added.** If a selected track can't be confidently matched to something already in the user's cloud library, it's skipped rather than added under a guess or pulled in from the catalog — matching quality directly determines how complete a generated playlist ends up being.

## Side-by-side

| | Method A: PWA | Method B: Native + TestFlight |
|---|---|---|
| Precedent | MediaTracker | Quicken |
| Build mechanism | Web manifest + icons on an existing site | Native build, cloud Mac CI (Codemagic) |
| Install mechanism | iOS Safari "Add to Home Screen" | TestFlight app |
| Server required | Yes (Historeum already has one) | No (self-contained native binary) |
| Apple Developer Program | Not required | Normally $99/year — already held (paying for Quicken) |
| Code signing / provisioning | None | Certificate + provisioning profile, both expire — pipeline already proven via Quicken; new app still needs its own App ID + profile |
| Rebuild cadence | None — every deploy is live instantly | Every 90 days (TestFlight expiry) at minimum |
| Code reuse from current work | High — reuses Historeum's existing MusicKit JS integration almost entirely | Low — matching/selection logic needs a native rewrite |
| Capability ceiling | MusicKit JS: catalog search, playlist read/write | Full native MusicKit: playback, queue, background audio |
| On-device BPM visibility | No — structurally unreachable from a browser | Yes — confirmed via `MediaPlayer`/`MPMediaItem.beatsPerMinute` |
| Iteration speed | Fast (instant web deploy) | Slow (build → sign → upload → Apple processing) |

## Open consideration

The deciding factor isn't really "which method is better" — it's what the app is actually for. If the goal stays "generate a playlist from a Billboard chart or a BPM sequence," the PWA route gets there almost for free, since Historeum already has the MusicKit integration this needs. If the goal is closer to "an alternative Apple Music player, Marvis Pro style" — or if seeing BPM data in the app matters, which is only possible natively — the PWA route can't get there at all, and native + TestFlight becomes necessary. Worth deciding deliberately rather than defaulting into either.

**Update:** for this project specifically, Method B's cost picture is lighter than the general case above. The Apple Developer Program membership and the entire Codemagic/TestFlight signing pipeline are already in place and proven, from shipping Quicken — so the real remaining cost of going native isn't the $99/yr or an unproven CI setup, it's just the normal per-app setup (new App ID, new provisioning profile), the 90-day TestFlight rebuild cadence going forward, and rewriting the matching/selection logic natively, since none of Historeum's JS or `PlaylistCreator`'s Python carries over.
