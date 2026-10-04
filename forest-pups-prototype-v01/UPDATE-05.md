# Prototype 05 — Travel polish

## Changed files
- New: audio.js, spawn.js, assets/forest-exploration.mp3, tests/travel.html, tests/music-loop.html, this guide.
- Updated: game.js, config.js, tangram.js, runtime-cache.js, manifest.webmanifest, README.md, ASSET-NOTES.md, TEST-REPORT.md and regression/content tests.
- Existing canonical illustrations, input tuning, menus, telemetry, shell and all twelve activities remain.

## Music and SFX
The supplied “ES_Forest Exploration - Sight of Wonders.mp3” is copied unchanged into the app. No remote music service is used. One app-wide Web Audio manager has separate music and SFX gain buses. Default music volume is 0.28 and SFX volume is 0.90. A further 0.20 music trim balances the mastered recording against the quiet synthesized cues. Parent-only sliders persist locally alongside master mute.

Fetching may happen before a gesture; AudioContext creation, resume and playback require the user's first game interaction or the speaker/parent sound button. The decoded track becomes one looping buffer. Near-silent margins are trimmed and a three-second complementary-gain tail/head crossfade is prepared once, avoiding a hard loop cut or recurring scheduling timers. The supplied original MP3 is retained unchanged. This is a musical crossfade, not a claim of a beat-authored studio loop.

Level loads only clear SFX; music keeps its source and playhead through completion, direct parent jumps and Lucky Dip. Mute and background/pagehide stop music while retaining its offset. Unmute/foreground/pageshow resume it; if iOS refuses automatic resume, the next ordinary touch or speaker press retries. Audio failures do not prevent puzzle play. Music decoding adds a one-time memory cost (roughly 46 MB of stereo PCM for this two-minute track, with a temporary second buffer during preparation).

## Spawn assignments and debug seeds
Every level defines safe spawnSlots and randomizeStartPositions. Pieces are assigned to these slots, never arbitrary coordinates. Shape 1 stays fixed as the tutorial; Solar System stays fixed to preserve its intentional layout. Shapes 2–4, all three colour activities, both pattern candidate sets and both tangrams shuffle. Targets never move.

A seeded shuffle chooses a fresh permutation per load/replay and avoids the immediately preceding assignment where possible. Validation checks visible bounds, spacing, the puzzle area and target separation. It uses each tangram's actual display dimensions. Resize retains the assignment. Spawn telemetry records seed, slot and home for every piece. Lucky Dip's level-order bag is separate.

Parent tools show the current seed. “Replay same seed” reconstructs it; enter a uint32 (0–4294967295) and choose “Play seed” to reproduce another trial. “Replay current level” chooses a new arrangement without changing the Lucky Dip bag/cursor. Tutorial/Solar display “fixed layout”. Sound settings and telemetry persist; the current game/seed itself is not restored after a cold launch, so export the seed/event history for later reproduction.

## Lucky Dip and completion
All twelve production activities now participate, including calibrated Boat and House. Debug-only/ineligible entries remain excluded. A bag visits each eligible activity once, then reshuffles without repeating the last activity immediately.

Wolf taps go through one wolfReactionRequested event and one presentation listener. The temporary 650ms reaction ignores retriggers while active, preventing overlapping yips/timers. A future wolf_flip sprite sequence can replace that listener without changing puzzle input logic. Wolf remains non-draggable during active puzzles.

The final piece settles for the existing 230ms, then the completion cue starts after a small 30ms margin. The shared 1.1-second celebration/exit activation remains, avoiding simultaneous placement/completion sounds. No extra transition controller or long delay was added.

## Offline update
Cache: forest-pups-p05-v2. The 29-entry runtime cache includes music, both new modules and all illustration/data files; synthesized SFX need no audio downloads. The browser retains the installed service worker itself. There are no remote runtime dependencies.

On an existing installation, opening/reloading online checks for a new worker. An idle untouched launch reloads when the new worker takes control. If play has already begun, the app avoids interrupting the child; close/reopen or refresh online before the travel session. Verify matching expected/active versions in parent tools. A failed cache install leaves the previous complete version active.

## Exact iPad travel check
1. Deploy this complete app folder to the existing HTTPS GitHub Pages location.
2. On the actual iPad, open the game online. Use Safari Share → Add to Home Screen if not already installed.
3. Launch from that Home Screen icon while online. Hold the top-right parent button for 1.5 seconds.
4. Expand Offline / travel readiness; press Check again as needed. Expected and active cache must both be forest-pups-p05-v2 and Offline ready must say yes.
5. Press Enable / test sound. Confirm music and pickup cue; check that music loaded and playing both say yes. Set a comfortable device volume.
6. Try Boat and House and a few other families once. Confirm parent jumps do not restart music. Mute/unmute, background the app, return and tap if audio needs unlocking.
7. Close the Home Screen app, enable Airplane Mode, ensure Wi-Fi is also off, then relaunch from the Home Screen icon.
8. Make a normal touch to unlock sound. Play one shape, one colour, one pattern, Solar System, Boat and House using the parent picker, then try Lucky Dip. Check music, success sounds, Wolf reaction, exits and direct jumps.
9. Open travel readiness again and confirm the same complete offline cache. Export telemetry from this same Home Screen context after the trial.

A desktop server-offline test cannot substitute for steps 7–9 on physical iPad hardware. Safari and Home Screen may use different storage contexts; iOS may evict website data, suspend audio or require a fresh gesture after interruption. The app cannot prevent OS eviction, guarantee permanent offline storage, enable Airplane Mode itself or override device output volume. Always do the cold-launch check before leaving connectivity.

## Remaining listening check
Listen through a loop on the iPad and compare music against placement/Wolf cues at the intended room/device volume. The crossfade is mathematically continuous, but musical phrasing and perceived loudness should be judged by ear.
