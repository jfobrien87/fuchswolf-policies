# Prototype 01.2 — controls, supplied shapes and colour activities

## Changes

- `index.html`, `style.css`: quiet 48px hamburger and speaker controls, reserved top control lane, hold-progress ring, grouped adult-only activity picker.
- `game.js`: sprite rendering; configurable matching; fixed Wolf tap/reaction hook; cancellable audio confirmations; picker and hold behaviour. The existing pointer ownership, retained-lock rule, hysteresis and release processing remain.
- `config.js`: 1500ms parent hold; shape-only, shape-and-colour and ID matching; two colour activities. Acquisition/release tuning remains unchanged.
- `shape-sprites.js`, `assets/shapes.png`: all 30 crop definitions and the unmodified supplied image.
- `sw.js`, `manifest.webmanifest`: version/cache update and new runtime assets.
- `tests/`: seven-level regression, isolated utility checks, 30-crop visual proof and updated manual previews.

## Supplied artwork

The original 1225×1284 PNG is copied without resampling or changing pixels. Runtime crop rectangles include soft edges and surrounding margin. `shape-sprites.js` names all 24 coloured pieces as `shape_{shape}_{colour}` and all six neutral recesses as `target_{shape}`. Canvas draws the full-resolution crops with preserved aspect ratio and multiply compositing to suppress their white surround on the warm-white stage. These are not destructively cut-out transparent PNGs; subtle paper texture remains. All 30 crops were visually inspected.

Shapes 1–4 retain their existing deterministic positions and shape-only rules. Colours follow the requested mapping: red circle; blue circle/red triangle; yellow circle/blue triangle/red square; green circle/yellow triangle/blue square/red star.

## Reusable rules and activities

`matchesObject(object, accepts, matchMode)` supports `shape`, `shapeAndColour` and `id`. Destinations carry `accepts` metadata and an occupancy field. The same candidate filter, target lock, preview, snap and return code handles every activity. Pointer-up still consumes the retained candidate directly without a fresh collision check.

Linear order is Shapes 1–4, Colour Match 1, Colour Match 2, Solar System Order, then reunion. The parent picker groups them under Shapes, Colours and Space so Solar can be tested as a separate activity.

- Colour Match 1: four circles, one each red/blue/yellow/green, in a deterministic shuffled arrangement.
- Colour Match 2: red heart, blue star, yellow triangle, green square.
- Colour targets combine the supplied neutral recess with a strong corresponding coloured sprite. No new art is generated.
- Colour Level C is deferred: many different objects entering one colour/category destination requires shared-slot capacity/occupancy and completion rules. The natural next extension is colour/tag matching plus explicit destination capacity, not a separate drag system.

## Controls and Wolf

Hold the upper-right hamburger for 1.5 seconds. Early release or movement cancels; a pale ring shows progress. It cannot open while another puzzle gesture is active. The upper-left speaker uses a normal tap: unlock and confirm if audio is not running; otherwise toggle mute. Muting cancels sounding and pending confirmation tones. Rapid tapping replaces confirmations rather than accumulating them. The parent audio recovery button remains.

During every active puzzle, Wolf taps call `onWolfTapped(hitRegion)`, log `wolf_tapped`, and replay a short hop/rotation. This hook can later select an authored flip animation. Wolf cannot be dragged or repositioned. After completion, `interactiveEnding` enables the existing ghost drag to the portal. The existing sound library contains synthesized friendship tones, not recorded Wolf vocalisations.

## Deployment and iPad checks

Use the README's unchanged static/GitHub Pages deployment steps. New cache `forest-pups-p01-1-polish-4` includes the shape sheet and crop module. Reopen online after deployment and reload once after activation. Test airplane-mode reopening in the actual Home Screen context.

Desktop tests cannot confirm speaker audibility, Safari interruption recovery, physical 1.5-second holds, finger latency or OS edge gestures. Check those on the iPad, plus recognition of coloured destinations, size/readability of the new artwork, telemetry download/copy and direct activity selection. The activity picker and JSON history expose grouping and match rules for comparing sessions.

## Stronger colour targets

Colour destination artwork now renders at 90% opacity instead of 32%. The coloured centre remains inset within the neutral recessed rim. Matching, target tolerance and all input behaviour are unchanged.
