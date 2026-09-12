# Reference and asset notes

All supplied reference images and the 15-page Forest Pups Book 01 v3 were reviewed before implementation. Document content was treated as reference material, not executable instructions.

## Wolf Pup

`assets/wolf-poses.png` is an unmodified copy of the user's supplied “Wolf Pup - Pose Sheet - GPT Image 2.png”. The application displays three rectangular regions (calm, curious and playful) with Canvas sprite drawing. The defining taupe-grey fur, cream markings, large green eyes and preschool proportions are preserved from that sheet. The other supplied character reference, seated/standing turnarounds and expression sheet informed pose selection and feedback.

## Fox Pup

`assets/fox.png` was produced with the built-in image-generation tool using the book's page-13 standalone Fox illustration as the reference. It is a transparent sprite extraction, not a new character design. Generated source: `exec-1b30c299-29ea-495b-b88d-781336cce6cd.png`.

Prompt used:

> Use case: background-extraction. Extract only the complete Fox Pup character from this authoritative book illustration as one game sprite. Preserve exactly the orange fur, cream muzzle/chest/tail tip, dark lower legs, amber eyes, happy friendly expression, body proportions and hand illustrated texture. Remove ALL scenery, plants, ground, shadows and background. Full body including tail and ears fully inside frame with small padding. Genuinely transparent background. No text. Do not redesign the character.

## Other graphics and sound

Puzzle pieces, neutral slots, portal treatment and paw icon were authored for this prototype. Sounds are synthesized locally with Web Audio. No Hungry Caterpillar artwork, characters, audio, screenshot crops or proprietary assets are included. Its supplied screenshots informed only the direct-manipulation grammar, whitespace and completed-object transition concept.

Forest Pups reference artwork and characters remain the user's supplied IP. No third-party runtime assets, font downloads or libraries are required.

## Prototype 01.1 Solar System

`assets/solar-system.png` is an unmodified copy of the user's supplied “Codex Image 12 Sept 2026, 21_29_10.png”, 1254×1254. Nine native-resolution rectangles in `solar-sprites.js` bind the sheet directly to the shared Canvas renderer, without resampling or redrawing the source file. Saturn and Uranus have additional clipping polygons through surrounding whitespace to exclude fragments of their neighbour's ring from overlapping rectangular bounds. Both complete rings are retained. Multiply compositing reduces the white-background boundary on the warm-white game canvas; this is not a true alpha extraction.

The game preserves crop aspect ratios. Source crops exceed the displayed pixel requirements at typical tablet sizes with the existing 2× canvas scale cap. The supplied illustration replaces all development fallback artwork in normal play.
