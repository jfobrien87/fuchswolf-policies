# Prototype 03 — canonical shapes, patterns and Lucky Dip

This extends Prototype 02 in place. Its shared shell, hold-to-open parent tools, sound controls, Wolf protection, exits, ending modes, telemetry and offline support remain. Ten ordinary activities now use the same input system and shell.

## Changes and files

- `config.js`: explicit `shapeOnly`, `shapeAndColour`, `colourOnly` rules; Colour Sort; two pattern definitions; `luckyDipEligible` metadata.
- `game.js`: unique shared destinations, completion by occupied slots, non-interactive sequence rendering, Lucky Dip and replay controls, play-order telemetry. The retained-lock resolver and pointer-up success rule are unchanged.
- `level-shell.js`: progress total counts unique destination IDs, so unused distractors do not prevent completion.
- `play-order.js` (new): metadata-based shuffled bag with cycle-boundary repeat protection.
- `runtime-cache.js`: version `forest-pups-p02-v4`, including the new local module. The p02 prefix identifies the existing shell/cache family; this content build is Prototype 03.
- `manifest.webmanifest`, `README.md`, `TEST-REPORT.md`, this document and browser test pages updated. `tests/content.html` is new.

## Canonical artwork

The existing `assets/shapes.png` was verified byte-for-byte against the supplied `simple_shapes_puzzle_elements_spritesheet.png`; it already is the canonical sheet. No replacement illustrations or lossy re-export were needed. `shape-sprites.js` supplies native-coordinate crops for all 6 rows × 5 columns, preserving painted edges. Canvas multiply compositing ignores the surrounding white against the warm-white stage; these are runtime sprite crops rather than separately generated transparent files.

Names are `shape_<shape>_<colour>` for circle, square, triangle, star, heart and diamond in red, blue, yellow and green, plus `target_<shape>` for six neutral recesses. All 30 assets remain local. Shape 1–4 retain the requested red-circle / blue-circle-red-triangle / yellow-circle-blue-triangle-red-square / green-circle-yellow-triangle-blue-square-red-star mappings.

All current shape activities use these assets. The old code-drawn renderer remains only as a fallback for explicitly configured development objects; none of the ten activities uses it for shape artwork.

## Matching and colour activities

`matchesObject(object, accepts, matchMode)` validates metadata:

- `shapeOnly`: shape equality, ignoring colour. The former `shape` spelling remains an alias for compatibility.
- `shapeAndColour`: both fields must match.
- `colourOnly`: colour equality, ignoring shape.
- `id`: existing Solar identity matching.

The two requested colour activities were already present and have been retained: four differently coloured circles, and red heart / blue star / yellow triangle / green square. No duplicate copies were added. Their coloured recesses remain strongly legible at the previously requested 90% overlay opacity, with a visible neutral inset rim. This intentionally preserves the toddler tuning requested after the earlier faint version.

New **Colour Sort** is a small colour-only proof: red diamond, blue heart, yellow star and green triangle go into four colour-specific circular destinations. It uses the same validator and renderer, with no level-specific input logic. Each destination holds one item; this is not yet a reusable multi-item collection bin.

## Pattern system and levels

Patterns add `pattern.cells`, `missingIndices` and normalized `positions` to a normal level definition. A cell is `[shape, colour]` or `null`. Prefilled cells render at 83% opacity and never become draggable. Missing cells have a neutral dashed box that does not disclose the answer's colour. Candidate objects reference the missing destination through ordinary `destination.id`, `position` and `accepts` metadata. Shared destination IDs are deduplicated.

- **Pattern 1:** red circle, blue circle, red circle, empty; blue circle answer, yellow/green distractors. Uses `shapeAndColour` with shape held constant.
- **Pattern 2:** red triangle, red square, red triangle, empty; red square answer, red circle/star distractors. Uses `shapeOnly` with colour held constant.

Both use the bottom-companion profile, a large left-to-right sequence, three candidates, the existing forgiving target acquisition, seated preview and retained-lock release. Wrong candidates return calmly. Completion counts occupied destinations, not all candidate pieces, and reports through the shared shell. Unused candidates become inactive when the puzzle completes.

The authored pattern is the source of presentation; destination metadata explicitly supplies the answer. This is not a procedural sequence inference/generation engine. Multiple missing positions can be authored with distinct destination IDs and corresponding candidates, but the shipped first two trials each use one missing position.

## Lucky Dip and parent controls

Hold the hamburger for 1.5 seconds. The picker has Shapes, Colours, Patterns, Space and Play Modes. Tap **Lucky Dip**, then **Back to play**.

Every ordinary activity opts in via `luckyDipEligible: true`. Debug-only definitions are excluded even if flagged eligible. A Fisher–Yates shuffle visits each eligible level once per bag, then reshuffles. If the new first entry equals the previous last entry, it swaps with the next entry. Starting Lucky Dip also avoids immediately repeating the currently shown activity when there is another eligible choice.

**Replay current level** restarts the activity without changing the bag or cursor. A named level button, Restart Level 1 or Reset telemetry exits Lucky Dip. The normal linear sequence still ends in the Wolf/Fox reunion; Lucky Dip continues indefinitely across shuffled bags. A page reload starts the normal sequence at Level 1; the in-memory Lucky Dip order is not resumed across reloads.

`lucky_dip_start`, `lucky_dip_next`, `level_replay` and each `level_start` include order/cursor/cycle or play-mode metadata. Exported JSON also includes the current order. Random play changes level order only; puzzle arrangements themselves remain deterministic. The ending selector applies to direct named jumps; Lucky Dip follows each level's configured ending mode.

## Offline and deployment

No new remote resources, image files or audio assets were introduced. All artwork and synthesized sounds remain local. The shared precache now includes `play-order.js`, and the bumped `forest-pups-p02-v4` cache keeps the same scope-aware GitHub Pages behavior.

Use `README.md` for local run/deployment. Use the iPad travel checklist in `UPDATE-02.md`, requiring **forest-pups-p02-v4** instead of its historical v1. Additionally, while offline, jump to Pattern 1, Pattern 2 and Colour Sort, start Lucky Dip, complete an exit, replay the current activity and export the session. Open/reload online after deployment until expected and active cache versions agree and readiness says yes.

## Manual iPad / Cilli observations

- Confirm the full sequence is readable left-to-right and the blank is understood as the place for a missing item. This cannot be validated by an automated solve.
- Watch whether Cilli compares candidates with the sequence or simply tries them. Record any adult guidance; these pattern tasks may be a developmental stretch at 2½.
- Verify a correct pattern drag survives finger-lift wobble, while an incorrect colour/shape returns without frustration.
- Check the strongly coloured recesses still read as destinations, and whether Colour Sort's circular bins make sense for non-circular pieces.
- Test Lucky Dip novelty versus predictability, actual tablet hit comfort, audible sound, parent access, and Home Screen offline cold relaunch. No physical iPad verification is claimed.

## Before the Tangram chunk

The current validator handles discrete metadata and one occupant per target. Pattern presentation is data-driven, but it does not infer sequences. Tangrams will need a separate geometric acceptance policy (position, angle, optional reflection and shape outline), while preserving the same pointer ownership and retained-intent contract. Do not approximate rotated polygon matching with this metadata validator. Multi-item sorting bins would also require an explicit target-capacity policy. Neither extension is included in this chunk.
