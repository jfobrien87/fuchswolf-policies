# Prototype 01 — verification report

Executed 11–12 September 2026 in the Codex in-app desktop browser. The optional test pages run the actual application inside browser frames. They send Pointer Events through its listeners and let its normal animation/level state machine complete.

## Passed

At **1180 × 820**, **900 × 600**, and **768 × 1024** CSS-pixel frame sizes:

- Immediate pointer-down acquisition using a point outside the visible shape but inside its padded touch area.
- Extra pointer-down/up events cannot steal or release the active gesture.
- Fast moves directly from source to target, outside the original hit area.
- Three repeated pickup/release attempts without state corruption.
- Empty-space release and smooth return.
- An incorrect shape destination and gentle return.
- Target acquisition and retained candidate state.
- Deliberate large movement away cancels the target; release afterward is logged as a lost-target release.
- **Critical wobble case:** acquire, move to 1.95 shape radii away (outside the 1.72-radius acquisition zone), then release at a slightly different position; the retained placement succeeds.
- Pointer cancellation with and without an acquired target returns the piece without completing it.
- Resize during a gesture cancels it and recalculates the layout.
- Ordinary Wolf ghost stays outside puzzle space; the real Wolf remains at the origin during dragging.
- Valid Wolf relocation animates to a safe destination. A release in puzzle space leaves Wolf safely outside it.
- Source hitboxes remain separated from one another and from Wolf's protected strip. Slots remain outside the strip.
- All ten matches across four deterministic levels.
- All four Wolf-to-portal interactions, the three next-level transitions and final reunion.
- A tap on a pup in the final vignette triggers a new friendship response.
- Restart preserves history; telemetry reset starts a fresh session and Level 1.
- The parent hotspot stays closed for a short touch and opens after four seconds.

The pure target resolver separately passed acquisition, compatible-target switching, retention and cancellation tests. The deterministic game levels have one target per shape, so compatible-target switching uses a two-target fixture.

## Real browser pointer check

A browser-driven mouse drag moved the Level 1 circle from its source to the slot and completed the placement. The release telemetry recorded both **`locked: true`** and **`captured: true`**, confirming actual browser pointer capture through release, in addition to the synthetic-event checks.

## Offline and visual checks

The local server was stopped after caching. A full reload at the application root still displayed the game, and a real browser drag completed Level 1 and revealed its portal without the server. Wolf’s portal interaction also completed offline and Level 2 appeared. This validates the installed desktop service-worker cache, not iPad Home Screen storage retention.

All three Wolf sprite crops were visually inspected; stray caption remnants were removed and each pose preserves its source aspect ratio. The final Wolf/Fox vignette was visually checked. An additional full walkthrough resized the frame before each portal drop and during every Wolf travel animation; all four transitions reached the expected next state.

## Simulated load

The 900 × 600 test introduced **20 ms main-thread stalls every 70 ms** while completing the full regression sequence. It still passed all assertions.

Observed requestAnimationFrame intervals on this desktop:

| Frame | Median | 95th percentile |
| --- | ---: | ---: |
| 1180 × 820 | 8 ms | 9 ms |
| 900 × 600, with artificial stalls | 8 ms | 16 ms |
| 768 × 1024 | 8 ms | 9 ms |

These are approximate callback intervals on a high-refresh desktop. They are **not iPad performance measurements** or touch-to-photon latency measurements. Artificial stalls are not a substitute for testing a slower tablet.

## Validation limits

- A physical iPad Air M2 was not available for testing.
- Automated standalone Chromium and WebKit launches were blocked by the host process sandbox. Native Safari control could not proceed because Accessibility/Screen Recording permissions were pending. The passing tests above were run in the in-app desktop browser.
- Synthetic multi-pointer and cancellation tests validate the application's event handling, not OS-level touch delivery or palm behavior.
- Physical release wobble, Safari edge gestures, app switching, sound audibility and first-touch audio unlock still need a device smoke test.
- Home Screen installation, clipboard/download UI and long-term cache/storage retention need validation in the actual iPad context.
- No known reproducible iPad-specific defect is claimed fixed or ruled out by these desktop tests.

## Suggested device smoke test before involving the child

Open the hosted HTTPS version and try one drag with substantial release wobble. Cancel a drag by switching away and back. Try two fingers. Complete one portal. Check the four-second parent hold and JSON export. Open the Home Screen version online, then relaunch in airplane mode. Use `tests/` for repeatable application-level checks if helpful.

## Prototype 01.1 — 12 September 2026

Executed the updated browser regression suite at 1180×820, 900×600 and 768×1024. All passed. Each run completed all 19 matches and five portal transitions through the real game event handlers. Checks include enlarged pickup regions (all nine Solar bodies), Wolf extended pickup, safe Wolf/source geometry, second-finger ownership, cancellation, empty/incorrect releases, deliberate lock abandonment, two same-target reacquisitions, and successful release at 2.8 base radii after retained acquisition. The shared pure targeting fixture also checks compatible-target switching.

Parent hold, restart/reset, raw JSON schema and JSON export Blob content passed. The export test suppresses the final file-save action and reads its Blob; it does not validate an iPad save/share dialog. New maximum-distance and reacquisition telemetry assertions passed.

Observed desktop frame intervals: 1180 median 8ms/p95 9ms; 900 median 8ms/p95 16ms with deliberate 20ms main-thread stalls every 70ms; portrait median 8ms/p95 9ms. These describe this desktop test, not tablet performance or input latency.

Visually inspected the Level 5 development layout: nine neutral sockets ordered left-to-right, a separate shuffled three-by-three tray, and Wolf clear of the activity. Final source artwork remains missing, so no sprite crop/ring fidelity or final art comprehension validation is claimed.

The separate reunion harness passed portal/travel resize through all five levels and independent rapid repeat Fox/Wolf reaction checks. A real browser drag outside the original shape hit area produced a successful match with `captured: true` in release telemetry. No physical iPad test was performed for 01.1.

## 01.1 supplied-art release verification

Integrated the supplied 1254×1254 Solar System sheet without modifying its pixels. Visually checked a nine-sprite crop proof, including complete Saturn/Uranus rings and exclusion of neighbouring artwork. Re-ran the full regression with the supplied assets: all tests passed at 1180×820, 900×600 with synthetic processing stalls, and 768×1024. All 19 matches, five portals, retained-lock wobble, safe geometry, telemetry export/reset and final interaction passed again. Recorded median/p95 desktop frame intervals: 8/9ms, 8/17ms with stalls, 8/9ms respectively.

The sheet is included in the versioned service-worker precache list. Offline reopening and physical touch/audio remain manual iPad release checks; this artwork update does not claim a new physical-device test.

Final in-game visual check on 13 September: all nine supplied illustrations render in the shuffled tray, Saturn and Uranus retain their rings, neutral destinations remain separate, and Wolf stays clear of the activity.

## Audio recovery and bottom-companion Solar layout

Re-ran the full regression after changing Solar to full-width targets/two tray rows and a protected bottom third. All three viewports passed all 19 matches, five portals, retained-lock release wobble, cancellation, extended pickups, export/replay and region-specific Wolf safety tests. Visually checked the larger illustrated layout in-game. A real browser drag produced a captured successful release with audio state `running` and `muted: false`. This verifies activation, not physical speaker output; listening on the iPad remains necessary. Parent tools include an explicit enable/test sound action.

## Prototype 01.2 — 16 September 2026

Passed the updated full suite at 1180×820, 900×600 (20ms artificial main-thread stalls every 70ms) and 768×1024: 27 placements, seven portals, final reunion, enlarged pickup, extra fingers, pointer cancellation, incorrect/empty release, hysteresis and release wobble, lock cancellation/reacquisition, fixed Wolf tap reactions, telemetry export/reset, replay and all seven parent-picker destinations. Pure matching tests verify shape-only ignores colour and shape-and-colour rejects a wrong colour. Colour A explicitly exercises a wrong-colour circle destination. Typical desktop median/p95 frame intervals were 8/9ms, 8/17ms with stalls and 8/9ms; these are not iPad latency measurements.

Separate controls suite passed active-drag isolation, short/cancelled/full holds, no early opening at 1300ms, opening after 1500ms, secondary-finger hold ownership, a Wolf tap released beyond the canvas, grouped level jumps and a minimum 48px utility target outside the game canvas. Real browser clicks unlocked audio and toggled mute/unmute, including repeated clicks. Audio engine state was running; physical audibility remains a device check.

Visually reviewed all 30 sprite crops, Level 1 and Colour Match 1. Soft edges and supplied colours remain intact; coloured recesses use the actual supplied sprite at low opacity.

Verified the new versioned offline cache contains runtime modules, both supplied sheets and character assets. Stopped the local server, reloaded the root game successfully from cache, and completed Level 1 with a real browser drag while offline. Restarted the server afterward. Actual iPad/Home Screen storage retention, native touch feel, audio interruption recovery, hold comfort and export dialogs remain manual checks.

## Stronger colour targets — 17 September 2026

Raised the shared colour-destination overlay from 32% to 90% opacity for both colour activities, retaining the inset recessed rim. Visually verified red, blue, yellow and green destinations in the running Colour Match 1 activity. Syntax and service-worker asset paths passed; cache version advanced to polish-4. This rendering-only change does not alter matching or input logic.

## Prototype 02 — 4 October 2026 (current release)

Earlier sections above are historical; this section describes the current shell build. Current parent hold is 1.5 seconds. Wolf is fixed/tappable during puzzles, and exits are independent of puzzle pieces.

Passed the actual-game regression at 1180×820, 900×600 with 20ms artificial stalls every 70ms, and 768×1024: all 27 matches, seven interactive exits, reunion, forgiving pickup, retained-lock release wobble, cancellation, multiple-pointer ownership, wrong/empty release, telemetry export/reset and replay. Desktop median/p95 frame intervals were 8/10ms, 8/16ms with stalls, and 8/10ms. These are not iPad latency measurements.

`tests/shell.html` passed ordered/idempotent completion events, both profiles' independent exit placement, seven passive endings, jump target-ID telemetry and a jump during travel without stale advancement. `tests/controls.html` passed drag isolation, early/cancelled/full holds, seven direct named jumps and 48px utility controls outside the puzzle canvas. Existing sound control logic is preserved; physical output requires listening on the device.

`tests/reunion.html` passed resize before each independent exit drop and during every travel tween, all seven transitions, final reunion and repeated independent pup taps.

Installed the worker under `/travel/forest-pups/`, with cache `forest-pups-p02-v1-%2Ftravel%2Fforest-pups%2F`. Parent/cache checks confirmed the matching active worker, complete runtime cache and zero missing files. Stopped the serving process. `tests/offline-trial.html` then passed an application reload, parent controls, all seven direct jumps, all 27 matches, seven passive exits, final reunion and complete-cache status without its server.

Also navigated directly to the cached subfolder root with the server still stopped. The game displayed correctly; a real browser drag completed Level 1 and exposed the separate doorway while the completed piece stayed visible. A real ghost-Wolf drag entered that doorway and Level 2 appeared, also with the server stopped. Visually checked the holding boundary and doorway clear of puzzle areas. This is stronger than checking cache presence alone, but is still desktop-browser evidence.

Physical iPad Safari/Add-to-Home-Screen cold launch, audible first-touch sound and interruption recovery, native multi-finger/pointer-capture behavior, storage retention, edge gestures and export dialogs remain manual checks. Follow `UPDATE-02.md` before travel. No physical iPad verification is claimed.

## Prototype 03 — 4 October 2026

The supplied canonical shape sheet is byte-identical to the shipped `assets/shapes.png`. All 30 named crops are retained; original shape-level colour mappings and the stronger colour destinations remain. Visually reviewed both new pattern strips, including triangle–square–triangle with all-red candidates. Visual QA caught and corrected an initial Pattern 2 configuration error. A separate startup check caught and fixed parent level selection before artwork finished loading.

Final build checks cover ten activities / 33 placements. The input suite exercises wrong pattern candidates and retained-lock release wobble on both pattern levels, as well as the existing padded pickup, extra-pointer ownership, cancellation, wrong-colour rejection, pure compatible-target switching, Wolf separation/tap behavior, all interactive exits, reunion, telemetry/export and replay. All checks passed at three viewports: 1180×820, 900×600 with 20ms artificial stalls every 70ms, and 768×1024. Final desktop median/p95 intervals were 8/10ms, 8/15ms with artificial stalls, and 8/10ms. Results are reported by `tests/runner.js`; synthetic checks do not measure physical iPad touch latency.

The shell suite passed all ten passive endings and a jump during travel without stale advancement. Controls passed 1.5-second holds, early cancellation, drag isolation, all ten named jumps and 48px targets. The content suite verifies shape-pattern metadata, all 30 canonical sprite names, colour-only validation, debug exclusion, full shuffled-bag coverage and cycle-boundary repeat protection. Eleven actual Lucky Dip activities/exits passed, spanning a reshuffle. Replay preserved the bag/cursor; direct selection exited Lucky Dip.

`forest-pups-p02-v4` reported a controlling matching worker and all 19 runtime cache entries present. Final offline verification passed with the actual local server stopped, using `tests/offline-trial.html` for an app reload, all ten direct jumps, 33 placements and ten automatic exits. `tests/content.html` separately passed eleven Lucky Dip activities with that server stopped. A fresh navigation to the cached app root also rendered Level 1 successfully. No external service is required for these runs.

Physical iPad Safari/Home Screen cold relaunch, audible sound, finger contact and gesture conflicts, export dialogs, long-term storage retention and Cilli's understanding of the pattern task still require device/user observation. A successful automated solution does not establish preschool comprehension. See `UPDATE-03.md` for those checks and the geometric-matching limitation before Tangrams.

## Prototype 04 — 4 October 2026

Both supplied tangram sheets were verified byte-identical to their local source files. Board and piece crops were visually checked. The solved-orientation green-hull ghost was inspected while the held sprite stayed upright. Supplied artwork is not geometrically consistent: this build retains proportional fit gaps rather than redrawing/distorting pieces. This is an art limitation, not a drop-detection failure; see `UPDATE-04.md`.

The full regression passed twelve activities / 43 placements at 1180×820, 900×600 with 20ms synthetic main-thread stalls every 70ms, and 768×1024. It includes prior shape/colour/pattern/Solar interaction, safe Wolf geometry, cancellation, additional pointer ownership, retained-lock wobble, all twelve interactive exits, final reunion, telemetry/export/reset and replay. Observed desktop median/p95 intervals: 8/9ms, 8/16ms with stalls, 8/10ms. These are not physical tablet latency measurements.

An initial smaller-tablet check identified the lowest tangram source's oversized pickup envelope reaching too close to Wolf. Its home moved upward and its extra radius multiplier became 1.05. A subsequent home-scale adjustment kept narrow artwork large enough in the tray instead of shrinking it to the final slot size. The final focused `tests/tangram.html` passed both puzzles at all three viewports, explicitly checking padded acquisition, Wolf separation, wrong-slot rejection/telemetry, empty release, locked pointer cancellation, extra fingers, release wobble, unrotated held pieces, interpolated automatic rotation, exact final angle/scale, placed-piece resize and shared exits.

The shell suite passed all twelve automatic endings, ordered/idempotent completion events and a parent jump during travel without stale advancement. Controls passed early/cancelled/full holds, drag isolation, twelve direct parent jumps and 48px utility targets. Lucky Dip passed eleven actual eligible-level endings across a reshuffle, preserving replay order and excluding the two tangram art-fit trials and debug-only content.

The final version is `forest-pups-p04-v4`. Readiness verified the matching active worker and all 22 runtime cache entries, including both sheets and the tangram module. Worker update verification also covered moving the previous Prototype 03 installation to the new version. Scope cleanup compares the full encoded deployment path, leaving other installations and ambiguous legacy caches alone.

Physical iPad Safari/Home Screen cold launch, native touch delivery/capture, audible sound and interruption recovery, clipboard/download UI, storage retention and Cilli's interpretation of the mismatched recess geometry remain manual checks. No physical-device verification is claimed.

Final offline result: stopped the actual server on port 8094. The app reloaded from cache, all twelve direct parent jumps and all 43 placements/twelve automatic exits reached the reunion. The focused Boat/House suite also passed at all three sizes with the server stopped, including rotation, wobble, resize and interactive exits.

## Prototype 04.1 — canonical assets, 4 October 2026

All six replacement PNGs match their supplied originals byte-for-byte. Visual comparison in tests/canonical-fit.html checked Boat and House assemblies against the solved references, including both hulls and the sloped chimney. The separate House board framing is registered per socket. A final source-edge expansion preserves painted bevels and removes white sheet pixels once during sprite preparation; no image readback happens per frame.

The full regression passed all 43 matches and 12 interactive exits through the reunion at 1180×820, 900×600 and 768×1024. This includes target switching/hysteresis, inaccurate pickup, extra fingers, pointer cancellation, free/wrong drops, repeated touches, release wobble, safe geometry, resize, replay and telemetry. The smaller viewport included simulated 20ms main-thread stalls every 70ms. Desktop frame intervals are not a hardware iPad performance claim.

After the final rendering adjustment, the focused Boat/House suite passed again at all three sizes. It also verifies five unique shuffled slots, a different arrangement on replay, stable arrangement through resize, ID-based socket mapping, pre-oriented held pieces, exact settled transform values and shared interactive exits.

Cache revision forest-pups-p04-v7 verified the expected active worker and all 26 runtime entries on both the existing preview and a fresh test origin. Offline gameplay results are recorded below. Physical iPad Safari gestures, Home Screen storage and acoustic sound level still need the normal on-device smoke test.

Final v7 offline trial: the temporary HTTP server was stopped, the game iframe reloaded from its installed cache, and all twelve direct parent jumps, 43 matches, twelve automatic exits and final reunion passed. Both replacement tangrams completed offline. The current preview server at localhost:8093 remains available. A further pure check passed 1,000 five-slot permutations with no identical consecutive arrangement and valid transforms for every piece at all three canvas sizes.

## Prototype 05 — travel polish, 5 October 2026

The supplied MP3 is byte-identical to its local original. Real browser decoding produced 121.515 seconds of source audio; silence-margin trimming plus the three-second crossfade produced a 115.435-second loop. Both PCM channels contain finite samples. Maximum first/last-sample delta was 0.009505. The travel test observed a full real loop wrap with one unchanged music source, rather than accelerating or simulating the music clock. Perceived musical phrasing/volume still needs listening on the actual iPad.

Passed 720 level/seed/viewport combinations and same-seed replays at 1180×820, 900×600 and 768×1024: unique slots, visible spacing, viewport bounds, Wolf hit-area separation, expected randomization, fixed tutorial/Solar and no unsafe fallback. A pure check additionally passed 3,000 deterministic seeds, fixed-layout overrides and twelve eligible Lucky Dip activities. Music kept its playhead/source across the parent jumps; mute preserved position, unmute resumed, and synthetic pagehide/pageshow exercised the production lifecycle handlers without duplicate sources.

Full input regression passed all 43 matches, twelve exits and reunion at three viewports, including 20ms simulated main-thread stalls on the smaller tablet. Retained target wobble, cancellation, extra pointers, wrong/empty release, geometry, resize, fixed Wolf reactions, replay and telemetry remained intact. Parent-controls tests passed hold timing/cancellation, active-drag isolation, all twelve direct jumps and the reserved 48px utility controls. Lucky Dip passed thirteen actual endings across a twelve-level bag boundary, including both tangrams, with replay order preserved and no immediate repeat.

A fresh installation verified the complete 29-entry cache. With its HTTP server stopped, a fresh game iframe reload completed all twelve activities, all 43 matches and the final reunion. An additional real button gesture decoded and started the cached music and triggered SFX offline. Developer test HTML is intentionally not precached: only the actual game entry point and runtime are offline deliverables.

Final revision is forest-pups-p05-v2 (adds explicit per-level configuration overrides; current layouts unchanged). Physical iPad Safari/Add-to-Home-Screen cold launch, Airplane Mode, speaker loudness and native suspension are not claimed as tested here. Follow UPDATE-05.md's exact on-device checklist before travel.

Final v2 confirmation: expected/active worker versions matched on the existing preview and fresh test origin. With the test server stopped again, all twelve activities and 43 placements completed from a fresh app reload; cached music decoded/played after the audio-check gesture. Lucky Dip also passed thirteen actual offline endings through a full twelve-level bag plus reshuffle, including Boat and House. The preview server on localhost:8093 is left running.
