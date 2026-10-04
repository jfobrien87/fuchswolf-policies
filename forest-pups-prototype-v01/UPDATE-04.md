# Prototype 04 — Boat and House tangram family

Historical notes: the art limitations below are superseded by UPDATE-04.1.md and the six canonical replacement assets.

Two five-piece activities extend the existing game. There is no manual rotation control or twist gesture. All previous activities, parent controls, sound, telemetry, matching forgiveness, shared shell and ending modes remain.

## Important artwork limitation

The supplied sheets are preserved, not redrawn or warped. Their coloured pieces are not exact geometric counterparts of the recesses. Most visibly, the Boat's blue triangle cannot fill the left trapezoid hull recess, and the green hull and yellow sail have differing proportions. The House's rectangular chimney piece cannot exactly fill its sloped chimney recess; several other ratios also differ slightly.

This build uses proportional fits, leaving visible gaps. The chimney is seated in the upper rectangular portion of its recess so it does not cover the roof. It does **not** claim an exact assembled-art fit. These are interaction prototypes using the supplied art, pending corrected, geometrically corresponding production pieces/boards. Both levels are available through the parent picker and normal sequence; they are temporarily excluded from Lucky Dip to keep these art-fit trials out of mixed child sessions.

## Changed files

New: `tangram.js`, `assets/boat-tangram.png`, `assets/house-tangram.png`, `tests/tangram.html`, this document.

Updated: `config.js`, `game.js`, `runtime-cache.js`, `sw.js`, `manifest.webmanifest`, `README.md`, `ASSET-NOTES.md`, `TEST-REPORT.md`, and the regression/content/shell/controls/offline/reunion/cache test pages.

## Reusable architecture

`tangram.js` contains a source-sheet registry, a shared level factory, board layout, proportional sizing and drawing adapters. Each theme supplies its sheet URL, board crop, piece IDs/crops, board-local slot bounds and solved rotations in radians. `tangramLevel(theme,title)` builds ordinary draggable/destination metadata consumed by the existing input system. Future sheets can be added as data instead of new Boat/House gameplay classes.

Targets accept piece identity using the existing `id` validator. Acquiring a target is not a precise polygon collision or angle test. A slot supplies the correct final transform, and the system interprets a nearby compatible drag as intent. Arbitrary authored angles are supported by rotated bounding-box fitting; current supplied art needs only zero degrees and the Boat green hull's 180-degree turn.

The generic snap tween now carries optional rotation and scale endpoints alongside position. Other renderer families continue their existing paths. Progress is still five occupied targets through the shared shell; there is no special tangram completion or exit controller.

## Sheets and presentation

Both supplied 1536×1024 images are copied without changing their pixels. Native-coordinate crops separate the five top-row pieces and the bottom board. Canvas multiply compositing ignores the surrounding white against the warm-white stage, preserving the painted texture and edges. There are no AI-redrawn pieces, procedural replacement silhouettes or exported lossy cutouts.

Both activities use `bottomCompanion`: a large board occupies the left part of the upper puzzle region, with a two-column five-piece tray to its right. Wolf remains fixed/tappable in the protected bottom strip. The lowest tray piece was moved upward after the smaller-tablet geometry test. Home pieces use generous presentation sizes; final proportional size is fitted to the authored recess bounds and settles during snapping. Image aspect ratios are preserved.

Boat IDs: `blue-hull`, `red-sail`, `yellow-sail`, `green-hull`, `orange-cabin`.

House IDs: `red-wall`, `blue-roof`, `yellow-roof`, `green-wall`, `orange-chimney`.

## Drag, preview and automatic alignment

- Pickup is immediate using the same Pointer Events ownership/capture flow.
- The held piece stays in its source orientation.
- Target acquisition immediately draws a translucent copy at the solved position, size and angle.
- Release consumes the retained target without a fresh collision test. The 230ms eased snap includes position, automatic rotation and proportional scale settling.
- Wrong/free releases return over 320ms; cancellation never commits a locked piece.
- No rotate button, two-finger rotation or orientation task is introduced.
- Placed pieces remain seated after resize; a resize during an active drag uses the existing cancellation policy.

Tangram tuning is data-driven: 1.05× the visible bounding radius plus the existing 34 CSS-pixel pickup padding; acquisition and cancellation each receive a 1.2× multiplier. With the existing constants, acquisition is 2.424× level base radius and cancellation is 4.32×. Base radius is `min(width × .046, height × .075)`. Magnetic attraction, instant preview and retained-lock semantics are unchanged. Only the piece's own unoccupied compatible slot can lock, even where generous acquisition zones overlap.

## Parent picker, progression and Lucky Dip

Hold the top-right hamburger for 1.5 seconds. Under **Tangrams**, select **Tangram Boat** or **Tangram House**, then **Back to play**. They appear after Patterns and before Space in the ordinary sequence. The unchanged shared door appears on completion; both default to interactive ghost-Wolf endings. The existing parent automatic-ending override also works.

`luckyDipEligible: false` excludes these two art-fit trials. The other ten activities remain in Lucky Dip, with replay/order and no-immediate-repeat behavior unchanged. After artwork and toddler checks, enabling the metadata flag is sufficient to include them.

## Offline and deployment

Cache version: **forest-pups-p04-v4**. The shared cache list includes the tangram module and both local sheets, for 22 runtime entries. There are no remote assets, APIs or new audio downloads. Worker cleanup now recognizes versioned Forest Pups caches across prototype families while still restricting cleanup to this same deployment scope. Globally named legacy caches remain untouched.

Registration requests a fresh worker update without relying on cached worker imports. After deploying all files, open online, reload after the update activates, then check the parent Offline / travel readiness section. Expected and active versions must both be `forest-pups-p04-v4`, with readiness yes. `tests/cache.html` is an additional explicit update/readiness check when diagnosing an older installation.

Before travel, follow `UPDATE-02.md`'s iPad checklist using the current version above. In airplane mode with Wi-Fi off, cold-launch the installed Home Screen app, use parent jumps to Boat and House, finish both, test sound and an exit, then relaunch again. Browser cache success here does not establish long-term iPad storage retention.

## Manual toddler checks and follow-up

1. Check whether the piece/recess geometry differences cause confusion. If they do, pause tangram child testing until matching art is supplied; do not compensate with spoken instructions about mismatches.
2. Watch whether the solved-orientation ghost is noticed and whether the automatic green-hull turn feels understandable.
3. Test pickup comfort for the narrow yellow sail and orange chimney on the actual iPad; invisible hit areas are deliberately larger than the artwork.
4. Confirm release wobble succeeds, and that the child can distinguish adjacent board slots without needing exact placement.
5. Verify Wolf access, actual sound output, native cancellation/multiple fingers, parent export and Home Screen offline cold launch.

Recommended next cleanup: replace mismatched art with geometrically corresponding piece/recess pairs; then review target centers and scale against those final crops. Keep deterministic tray positions during this first comparison. Optional tray randomisation can come later, with the chosen order logged for repeatability. This is identity-to-slot matching with automatic transforms, not a free-form polygon assembly/rotation solver.
