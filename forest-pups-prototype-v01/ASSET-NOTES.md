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

## Prototype 01.2 shape sheet

`assets/shapes.png` is an unmodified copy of `simple_shapes_puzzle_elements_spritesheet.png` (1225×1284). `shape-sprites.js` maps 6 rows × 5 columns to 24 coloured sprites and 6 recessed targets. Runtime cropping retains edge margins and source pixels; multiply compositing suppresses the white surround. No image generation, recolouring or procedural replacement is used for these puzzle assets. All 30 crops can be reviewed at `tests/shape-art.html`.


## Prototype 04 tangram sheets

`assets/boat-tangram.png` is the unmodified supplied “Colorful Boat Puzzle Pieces and Board.png”; `assets/house-tangram.png` is the unmodified supplied “Colorful House Puzzle Pieces.png”. Runtime crop rectangles, board-local slot bounds and rotations are in `tangram.js`. No new image generation or procedural shape replacement is used. Proportional fitting preserves pixels/aspect ratios but cannot reconcile the source piece/recess geometry discrepancies. See `UPDATE-04.md`, especially the blue Boat hull and House chimney limitations.


## Prototype 04.1 canonical tangrams (supersedes the Prototype 04 fit limitation)

Six new PNGs retain the supplied filenames and are byte-identical copies in assets/. Empty boards are the runtime boards; loose sheets supply every draggable pixel; solved images supply placement/orientation correspondence. The House empty/solved images have different framing, so each solved outline is registered to the corresponding empty-board socket. Source polygons and registered socket polygons are explicit native coordinates in tangram.js.

The renderer prepares and caches a fitted sprite once per piece using affine triangles, correcting outline/proportion discrepancies between the separate illustrations. This is not a rigid, aspect-preserving crop: the loose artwork is fitted to the socket geometry. After preparation, gameplay only translates/scales the static sprite. All ten pieces are pre-oriented. No solved-image crops, replacement art, generated textures or remote assets are used. Source-over compositing preserves the supplied colours over the wooden board.

## Prototype 05 music
assets/forest-exploration.mp3 is a byte-identical local copy of the user-supplied “ES_Forest Exploration - Sight of Wonders.mp3”. It is cached locally; there is no streaming service or remote dependency. The app prepares a three-second tail/head crossfade in decoded memory without overwriting the source. Distribution rights are those of the supplied recording, not a new license supplied by this prototype.
