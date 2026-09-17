# Forest Pups — Preschool Interaction Prototype 01.2

A complete, dependency-free static game for testing drag → match → release with a 2½-year-old. Four deterministic shape levels, two colour activities and a Solar System ordering level lead through Wolf's ghost-destination portal interaction to a Wolf-and-Fox friendship vignette. No accounts, external services, analytics requests, menus in normal play, scores or spoken instructions.

**Prototype 01.2 includes supplied shape and Solar System artwork, two colour activities, visible utility controls and an adult activity picker.** See `UPDATE-01.2.md`.

## Run locally

From this folder, run:

```sh
python3 -m http.server 8000
```

Open **http://localhost:8000/** in a browser. Any ordinary static HTTP server works. No install or build step is required. Do not double-click `index.html`: module imports and offline caching require an HTTP origin.

To try it from an iPad on the same Wi-Fi, use the computer's LAN address and port instead of `localhost`. Plain LAN HTTP is adequate for play, but use HTTPS hosting for Home Screen/offline and clipboard validation.

## GitHub Pages

1. Copy the contents of this folder into a dedicated repository's root, or into a subfolder of your existing Pages publishing directory. Preserve the relative asset paths. Include `.nojekyll`.
2. For a new repository using branch deployment: open **Settings → Pages**, select **Deploy from a branch**, choose your publishing branch and either **/(root)** or **/docs**, then save. For existing Pages infrastructure, keep its existing deployment process.
3. Open the HTTPS URL shown by GitHub. For a subfolder, include its trailing slash, for example `https://YOUR-SITE/forest-pups/`.
4. Verify Level 1, a successful placement, the parent panel, and the offline status before handing the iPad to the child.

No backend or build workflow is needed. The optional `tests/` folder can be omitted from deployment; it is never cached or shown in gameplay. GitHub's [publishing-source guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) describes the branch/folder options.

## iPad Safari and Home Screen

1. Open the hosted HTTPS URL in Safari, landscape, in a normal browsing session.
2. Use **Share → Add to Home Screen**. On versions that offer it, enable **Open as Web App**, then tap **Add**. See [Apple's iPad web-app instructions](https://support.apple.com/en-in/guide/ipad/ipad8f1f7a29/ipados).
3. Launch the Home Screen icon while online. Allow the illustrations to load. Open parent tools and check the offline-cache status. Reload once if the first installation is not yet controlling the page.
4. Test opening/reloading in airplane mode before the observation session. The complete game and sounds are local once cached.
5. Reset telemetry immediately before the child's session. Keep the tablet in landscape and use the same orientation and audio volume for repeat sessions.

A fresh launch starts at Level 1; telemetry persists. Safari and an installed Home Screen app may have different storage contexts: export from the context in which the child played.

## Parent tools and telemetry

Hold the **hamburger in the top-right corner for 1.5 seconds**, without moving more than 10 CSS pixels. The game pauses while the panel is open. This is an observational convenience, not a security boundary.

The panel provides:

- Counts of matches, wrong-target attempts, empty releases, acquired/lost locks and pointer cancellations.
- Time to first drag, time to first success and completion time/attempts for each puzzle.
- Complete raw JSON history, JSON download and clipboard copy. If clipboard permission is unavailable, the raw field opens for manual selection/copy.
- **Restart Level 1**, preserving history with a restart event.
- **Reset telemetry**, clearing history and starting a new session at Level 1.
- Independent overlays for hitboxes, acquisition zones, cancellation zones and the retained destination, plus mute.
- A grouped activity picker for Shapes, Colours and Space.

The top-left speaker is always available: tap to unlock sound, then tap to mute/unmute. Utility buttons are outside the puzzle canvas and ignore secondary touches during a drag.

Turn overlays off before testing the child. The JSON includes the configuration and viewport, so sessions can be compared after changing tolerance values.

All observation data stays in this browser's local storage. There are no analytics endpoints, beacons, third-party scripts or fonts. Downloads happen only when the adult requests one. Storage failures do not block play; the parent panel reports them and in-memory export remains available. Export after each session: browser data can be cleared or evicted.

History retains the latest 15,000 events. A drag path is sampled at most every 50 ms and capped at 500 points per gesture; total distance still accumulates beyond this sample cap. Distances and coordinates are CSS pixels relative to the play canvas. Frame timing and input measurements are approximate, not hardware latency measurements. Parent-panel time is excluded from puzzle timers. Background suspension is logged; wall-clock puzzle durations may include time spent away from the game.

## Matching and tuning

`config.js` contains the named constants and all deterministic level positions.

| Setting | Default | Meaning |
| --- | ---: | --- |
| `TARGET_ACQUIRE_RADIUS` | 1.9 | Level base-radius multiplier |
| `TARGET_SNAP_TOLERANCE` | 0.12 | Extra radius added to acquisition, never a release-time collision check |
| `TARGET_RELEASE_RADIUS` | 3.6 | Larger distance required to abandon a retained candidate |
| `TARGET_MAGNET_STRENGTH` | 0.12 | Gentle rendering attraction; does not distort input position |
| `TARGET_SNAP_DURATION` | 230 ms | Successful placement tween |
| `GHOST_PREVIEW_ACTIVATION_THRESHOLD` | 0 ms | Immediate seated preview; retain zero for this study |
| `HIT_PADDING` | 34 px | Extra invisible touch area, scaled slightly on large screens |
| `PICKUP_SCALE` | 1.08 | Eight-percent lift |
| `FINGER_LIFT` | 16 px | Vertical drag offset |
| `RETURN_DURATION` | 320 ms | Gentle return |
| `WOLF_ACQUIRE_RADIUS` | 2.2 | Portal acquisition multiplier |
| `WOLF_RELEASE_RADIUS` | 3.8 | Portal cancellation multiplier |

Acquisition uses the logical piece center, with the original touch offset preserved and a small upward lift. Rendering attraction is separate. A compatible target locks on entry and supplies a correctly seated translucent preview. It remains locked outside the acquisition zone, until the larger cancellation radius is crossed. Entering another compatible target transfers the lock. **Pointer-up consumes the retained state directly; it does not retest final collision geometry.** Pointer cancellation always returns the piece, even if a target was locked.

Each object has one compatible destination. Solar objects use the same base acquisition radius regardless of visual scale; incompatible neighbouring sockets cannot compete for a lock. The pure targeting test checks compatible-target switching with a separate two-target fixture.

Wolf’s pickup envelope is 1.4× his idle footprint, clipped to the protected region during puzzles. Solar objects share a minimum touch footprint, so Mercury remains easy to acquire.

## Input and Wolf safety

- Pointer Events acquire immediately on pointer-down. Pointer capture retains ownership outside the original artwork and hit region.
- One gesture owns interaction at a time. Additional fingers do not steal or release it. Pointer cancellation, capture loss, blur and visibility loss restore an active piece safely.
- The play surface prevents scrolling, selection, context menus and browser image dragging.
- Wolf stays in a protected left region for Shapes/Colours and the bottom third for Solar. During puzzles he is tappable but cannot be dragged; taps trigger a reusable happy-reaction hook.
- After completion, the real Wolf remains in place during a ghost drag. A valid portal release starts the transition.
- Only after all pieces are locked may Wolf cross puzzle space to enter a portal. The completed circle (or Sun in Level 5) becomes a softly glowing circular passage. Portal placement also uses hysteresis.
- Hints begin with a brief curious pose after 6.5 seconds, then one gentle piece bob after 15 seconds. Portal hints use a few quiet destination dots, without auto-completing the interaction.

## Implementation and deliberate compromises

- Single Canvas 2D play surface, DOM parent panel, ES modules, cached shape textures and a maximum device-pixel ratio of 2. No framework or runtime dependencies.
- Wolf uses rectangular sprite regions of the **supplied pose sheet**, without a redesign. A multiply blend lets its white source background sit on the warm-white canvas. Curious/playful poses use simple sprite swaps; there is no rig, locomotion or procedural animation. The pose variants have slightly different silhouettes.
- Fox is an AI-extracted transparent sprite based on the book's Fox illustration. The final scene uses two static sprites and brief tweens; tapping either pup repeats the happy bounce and soft chime.
- Shapes and recesses use native-resolution crops of the supplied shape sheet. Shape levels match silhouette only; colour levels use a strong supplied colour overlay on the recess and match shape plus colour.
- Audio is a small set of quiet synthesized tones, rather than recorded Wolf vocalisations. It unlocks on the first touch; no network audio is loaded.
- Wolf ghost dragging is available only for configured completion portals, after puzzle objects are locked.
- The game responds to portrait dimensions, but the study is designed for landscape. It has no rotate-device instruction or screen-orientation enforcement.
- Progress is not resumed after reload; telemetry is retained. This keeps repeat trials deterministic.

## Offline updates

`sw.js` precaches every runtime file and uses cache-first reads. Bump the `CACHE` version after changing runtime files. Reopen online and reload after the new service worker activates to use the new version. Close stale game tabs before a new study session. Do not change the cache version during a child's trial. A failed new precache leaves the previous complete cache intact.

Offline support requires a secure origin (HTTPS or localhost). Operating-system storage eviction, private browsing, restricted storage and removal of site data can remove cached files. Always verify offline operation in the actual installed context before relying on it.

## Verification

Open `tests/` in a browser and click **Run regression**. The harness creates real game frames at three viewport sizes and dispatches synthetic Pointer Events through the actual game listeners. It uses a separate telemetry key. It does not bypass level completion or portal transitions. See `TEST-REPORT.md` for executed checks and limits.

The regression harness does not replace physical touch validation: synthetic events cannot validate native pointer capture, finger contact, iPad edge gestures, Safari audio policy or actual input-to-photon latency.

## First child session: five observations

1. **Acquisition:** Does the first touch land on a piece, near its edge, or on the slot? Does immediate lift make it clear that the piece is held?
2. **Drag and release:** Does the child maintain contact, lift intentionally, use a second finger, or try tapping? Watch whether release wobble still ends in the intended successful match.
3. **Matching:** After the first circle, does the child search by silhouette and adapt when the layout changes, or repeatedly use the same spatial movement?
4. **Feedback and retry:** Does the ghost preview prompt release? After a gentle return, does the child retry calmly, abandon the piece, or seek adult help?
5. **Companion and transfer:** Does the child notice Wolf's reactions and discover dragging his ghost into the portal? Observe the response to the Fox reunion without verbally introducing the mechanic.

Begin without an explanation, record any adult assistance, and do not demonstrate the drag unless you deliberately decide to end the unaided observation period. Note the moment and type of assistance so later events can be interpreted correctly.

## Files

- `index.html`, `style.css`: full-screen play surface and hidden adult tools.
- `game.js`: input ownership, game phases, rendering, audio and local telemetry.
- `config.js`: tolerances, level layouts and pure hysteresis rule.
- `shape-sprites.js`: all 24 coloured pieces and six neutral shape recesses.
- `solar-sprites.js`: supplied sheet URL, native-resolution crop rectangles and ring-safe clipping metadata.
- `assets/`: supplied Wolf sheet, derived Fox sprite and app icons.
- `manifest.webmanifest`, `sw.js`, `.nojekyll`: static/PWA deployment.
- `tests/`: optional browser regression harness.
- `ASSET-NOTES.md`: source provenance and extraction prompt.

## Solar layout and audio

The Solar activity uses a full-width ordering strip, two rows of larger planets, and Wolf's protected bottom third. Levels 1–4 retain their existing layout. If sound is silent, hold the parent hotspot and press **Enable / test sound**. This unmutes the game and retries browser audio activation. Also check device volume and output route. Reopen online after replacing the deployed files so the updated service worker can activate.
