# Prototype 01.1 — release handoff

The interaction update and Level 5 are implemented with the supplied Solar System illustrations. Existing Prototype 01 and earlier development archives remain intact.

## Changed files

- `config.js`: larger defaults; shared object/level definitions; deterministic Solar order and shuffled tray. Original Levels 1–4 positions are retained.
- `game.js`: generic object rendering, expanded hit areas with deterministic selection, new telemetry, fifth-level progression and independent reunion reactions. Existing pointer capture and retained-lock pointer-up rule remain.
- `solar-sprites.js`: supplied sheet/crop metadata and whitespace clipping for neighbouring rings.
- `assets/solar-system.png`: unmodified supplied 1254×1254 sheet.
- `sw.js`, `manifest.webmanifest`: 01.1 cache/assets and app name.
- `tests/runner.js`, `tests/reunion.html`: five-level regression and optional Solar visual stop.
- README, asset notes and this handoff: updated operation/testing details. No runtime dependencies added.

## Tuning

| Constant | Previous | New |
|---|---:|---:|
| TARGET_ACQUIRE_RADIUS | 1.6 | 1.9 |
| TARGET_RELEASE_RADIUS | 2.65 | 3.6 |
| HIT_PADDING | 20 | 34 |
| WOLF_ACQUIRE_RADIUS | 1.85 | 2.2 |
| WOLF_RELEASE_RADIUS | 2.9 | 3.8 |
| WOLF_TOUCH_MULTIPLIER | — | 1.4 |

Acquisition includes the unchanged 0.12 snap tolerance. Radius multipliers use the level base radius, not each planet's visual size. Release never performs a fresh collision test. Wolf’s invisible region is clipped to the safe strip; dragged objects are kept outside it. Overlapping enlarged piece pickup regions prefer visible bounds, then nearest object centre.

## Content representation

`LEVEL_DEFINITIONS` contains object ID, renderer, visual scale, touch/minimum-touch scale, acquisition/release multipliers, home coordinates and destination ID/coordinates. The original four levels adapt their existing shape data into this structure. Level 5 uses the identical handlers and targets, with neutral sockets and a subtle path. `SOLAR_ORDER` is Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune. The shuffled tray is deterministic. All nine have equal minimum pickup radii, including Mercury.

## Telemetry additions

- `hitRegion`: `visible_bounds` or `extended_bounds` on piece pickup/Wolf touch. Visible bounds are a rectangular artwork-envelope approximation, not per-pixel opacity testing.
- `wolf_pickup_extended_bounds` event.
- `target_reacquired` event and per-gesture `reacquisitions` count.
- `maximumDistanceAfterLock` in CSS pixels and per-target acquisition/reacquisition/maximum-distance history. Maximum includes movement that causes cancellation; records are copied rather than mutated later.
- Exports include prototype version, level definitions, configuration and artwork status. Existing history/storage key retained.

## Deliberate limits

The supplied sheet is drawn using original-resolution crop rectangles, with whitespace clipping on Saturn/Uranus to exclude neighbouring ring fragments. Both complete rings were visually checked. White is suppressed with multiply compositing rather than destructive background removal; a faint paper boundary can remain. Reunion taps now independently restart a short hop/rotation without a cooldown. Both reuse the existing synthesized friendship chime; this project has no recorded Wolf vocalisation or Fox yip to reuse.

## iPad follow-up

Check real finger pickup near Wolf/planet edges, release wobble, second-finger interruptions, Safari edge gestures, Home Screen audio unlock, and JSON download/copy. Open online after deployment to activate the updated cache, then verify a complete offline launch. Check recognition and ring readability at the actual iPad size. Desktop synthetic tests cannot establish touch latency or physical tablet performance.

## Follow-up: audio recovery and full-width Solar layout

Solar now uses the full width for nine ordered destinations and a shuffled tray in two rows. Its base radius increases from 0.027 to 0.039 of viewport width (about 44% larger where width limits size), with a 0.07 height cap. Wolf has a protected bottom-third region for this level only; his footprint is fitted to this region. Ordinary ghost moves and dragged pieces respect the new boundary. Levels 1–4 retain their left-side companion layout.

Audio resumes from non-running states, including interruptions, and schedules sounds after resume completes. A supported browser audio session is set to playback. Parent tools now include **Enable / test sound**, which also clears mute. First real touches anywhere in the game document attempt audio unlock. Device volume, browser/tab mute and the physical speaker route still need a listening check on the iPad.
