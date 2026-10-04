# Prototype 02 — shared shell and offline travel build

This updates the working prototype in place. All seven activities, supplied artwork, strong colour destinations, Solar layout, matching tolerances, audio synthesis, local telemetry and final reunion remain. No new learning activities were added.

## Changed files

New: `level-shell.js`, `shell-view.js`, `offline.js`, `runtime-cache.js`, `tests/shell.html`, `tests/offline-trial.html`, this document.

Updated: `config.js`, `game.js`, `index.html`, `style.css`, `manifest.webmanifest`, `sw.js`, `tests/runner.js`, `tests/controls.html`, `tests/cache.html`, `tests/reunion.html`, `README.md`, `TEST-REPORT.md`. Existing image assets are unchanged.

## Shared shell and layout

`level-shell.js` owns lifecycle state, progress, an independent exit and two normalized layout profiles. `leftCompanion` protects the left 29% for Wolf; `bottomCompanion` protects the bottom third. Each profile defines puzzle bounds, Wolf bounds/home and exit area/anchor. Shapes and Colours use the left profile; Solar uses the bottom profile. Utility controls remain in their own DOM lane outside the puzzle canvas.

The shell has no DOM, timers, input handlers or puzzle implementation. The existing game calls `shell.progress(placed,total)`. A small event bus emits `puzzleProgress`, `puzzleCompleted`, `exitActivated`, `wolfLocomotionUnlocked`, `endingStarted` and `levelCompleted`. Subscribers connect existing celebration/audio, travel and telemetry. Subscriptions are installed once; level jumps replace shell state rather than adding listeners or delayed callbacks.

Lifecycle: `puzzleActive` → `puzzleComplete` → `wolfLocomotionUnlocked` (interactive only) → `levelEnding`. A one-shot completion flag prevents duplicate ending events.

A level’s existing definition can use:

```js
layoutProfile: "bottomCompanion",
endingMode: "interactive", // or "passive"
holding: { variant: "path" }, // or "none"
exitType: "genericDoor", // or "pathExit"
exit: {
  visibilityDuringPuzzle: "hidden", // "inactive" renders dimly
  position: { x: 0.84, y: 5 / 6 } // optional; profile anchor is default
}
```

Positions are fractions of the play canvas. Keep custom exits within the profile’s reserved exit area. Future visuals belong in `shell-view.js`; they do not require changes to matching or input logic. Additional progress-driven presentation can subscribe to `puzzleProgress`.

## Parent access, sound and picker

The existing understated 48px hamburger is retained at top-right, with a 1.5-second hold and subtle progress. Short/released/moved holds cancel. The matching top-left speaker unlocks audio and confirms on first activation, then toggles mute. Repeated activation stops prior voices before starting a confirmation; it cannot steal an active puzzle drag. The parent **Enable / test sound** action remains available.

Hold the hamburger, tap a level name under Shapes, Colours or Space, then **Back to play**. The named buttons replace the previous select-and-load control. Current level is highlighted. A jump clears capture/drag, pointer ownership, transient audio, pending travel/fade and completion state; history is preserved. Telemetry includes `parent_level_jump.targetLevelId` and selected ending mode.

The adult ending selector overrides the next directly selected activity. Its default follows the level configuration. A normal subsequent level uses its own default. This makes interactive/passive comparisons possible without editing code.

## Wolf and independent exits

Wolf stays fixed and tappable during active puzzles. He cannot be dragged into puzzle space. A quiet path boundary represents the holding area and opens when the exit activates. This is intentionally placeholder art, replaceable by future fence/log/gate sprites.

The separate doorway is hidden during puzzles, appears after the completion celebration, and never consumes or hides a completed puzzle piece. It is rendered without its own touch listener. Interactive endings unlock the existing ghost-Wolf gesture; valid release moves the real Wolf to the exit. Passive endings begin that same simple tween automatically. Both fade into the next activity; the last still reaches Wolf and Fox.

**All seven levels now use the shared independent exit and default to interactive. None retains the puzzle-piece-as-portal ending.** Internal `portal` names and some existing telemetry names remain as compatibility adapters for the established input/transition code. No skeletal locomotion or complex art system was added.

## Offline cache and readiness

`runtime-cache.js` declares `forest-pups-p02-v1` and every runtime HTML/CSS/JS, config, manifest and image. Audio is generated locally, so there are no audio downloads. No CDN, web font, API, authentication or backend is needed.

The worker caches relative URLs within its registration scope, including root and `index.html`; query-string game launches resolve to the cached entry. Cache names include the deployment subfolder. Activation cleans only old p02 caches for this same scope, leaving other apps and ambiguous legacy p01 caches alone. Test pages and documentation are not required or cached for normal play.

Parent **Offline / travel readiness → Recheck offline status** verifies both the controlling worker’s version and the presence of all listed cached responses. It reports missing files instead of equating “service worker present” with readiness. It also shows audio state, level ID, layout and ending mode. Readiness never blocks play.

For a new release, bump `runtime-cache.js`’s version, deploy all files together, open online and reload after activation. Check expected and active versions agree before testing. Avoid updates during a child session.

## Exact iPad travel check

1. Deploy this folder’s contents to the intended HTTPS GitHub Pages path, preserving relative paths and `.nojekyll`. Use the trailing slash for a subfolder. Local run/deployment details are in `README.md`.
2. In iPad Safari, open that HTTPS address online, in landscape, in a normal browsing session. Wait for the artwork. Share → **Add to Home Screen**; if offered, enable **Open as Web App**. Add it.
3. Launch the new icon while still online. Hold the top-right hamburger for 1.5 seconds. Expand **Offline / travel readiness**, then recheck. Require registered **yes**, expected/active version **forest-pups-p02-v1**, and **Offline ready: yes**. If not controlled yet, close the panel, reload/relaunch online and check again. If files are missing, remain online and retry before travelling.
4. Tap the speaker, or use **Enable / test sound**, and actually listen at the intended volume/output route. Check mute/unmute. “Audio running” alone does not prove sound is audible.
5. Use the parent buttons to inspect a Colour activity and Solar. Confirm reachable controls, no stage scrolling, usable large pieces and Wolf safely separated. Complete a match with release wobble and an interactive Wolf exit.
6. Turn on airplane mode and ensure Wi-Fi is also off. Close the Home Screen app and launch it again from its icon. It should start Level 1 with artwork. Recheck offline readiness, use parent level jumps and sound, complete an activity and exit, then close/relaunch once more.
7. In parent tools, set the ending override to **Automatic — Wolf goes to exit**, tap a level and complete it: Wolf should enter automatically. Return the selector to **Level default** for normal child observation.
8. Test JSON export/copy in this same installed context. Safari and the installed app may have separate stored history. Export after each child session; reset telemetry just before a fresh trial.
9. Repeat the offline launch check shortly before departure and after any deployment. Do not clear website data. Storage can be evicted by the OS; caching is not a permanent storage guarantee.

The desktop browser passed offline reload and all activities with the server stopped. A physical iPad/Home Screen cold launch, native Safari gestures, audible sound and iPad export UI were **not** available to verify here. Steps above remain required on the travel device.

## Next Cilli observations

- Does the quiet boundary help explain why Wolf reacts to taps but does not follow a drag during puzzles?
- Does Cilli notice the new independent exit after completion, and transfer the familiar ghost gesture to it without prompting?
- Compare one interactive ending with one passive ending: engagement, waiting/confusion and desire to keep touching Wolf. Record the mode and any adult help.
- Confirm release wobble still succeeds, and that the larger Solar activity remains comfortable on the actual tablet.
- Watch whether the utility icons distract or attract repeated taps; confirm an accidental quick hamburger touch does not open adult tools.

Use these observations before replacing the placeholder boundary/door with production art or adding new content families.
