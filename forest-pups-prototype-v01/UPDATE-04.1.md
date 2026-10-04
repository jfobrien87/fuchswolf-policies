# Prototype 04.1 — Canonical Boat and House

Both puzzles now use the six supplied canonical references. The empty image is the target board, loose-sheet pixels are the draggable pieces, and solved-reference outlines determine correct orientation and fit. The Boat hulls and House sloped chimney now fill their corresponding sockets.

The separately supplied illustrations are not pixel-identical geometry. In particular, the House empty and solved boards have different framing. Explicit source/solved/socket correspondences in tangram.js prepare ten fitted static sprites once and cache them. This preserves the supplied painted artwork while adjusting its outline to the empty-board recess. A Unity production pipeline can bake these into sprites; no runtime deformation or manual rotation is required during play.

Five safe upper-right tray positions are shuffled on each entry/replay. An identical consecutive arrangement is prevented; resize preserves the current arrangement. Telemetry records each piece-to-slot assignment as tangram_tray_shuffled. Correct sockets never shuffle.

The existing immediate pickup, generous acquisition/cancellation zones, magnetic attraction, retained-lock release, ghost preview, scale tween, Wolf holding region and lower-right exit remain. Menu and audio controls are unchanged. Normal sequence and parent picker include both levels; existing Lucky Dip eligibility remains unchanged pending a child trial.

## Try it
Run the static folder with a local server, or deploy its contents to the existing GitHub Pages location. Hold the top-right parent button for 1.5 seconds, choose Tangram Boat or Tangram House, then Back to play. Replaying changes tray order.

Reopen online after replacing a deployed build, reload after the worker updates, and check parent Offline ready: yes. Cache revision is forest-pups-p04-v7, with all six references and 26 runtime entries. Verify an airplane-mode Home Screen launch on the actual iPad before a child session.

## Validation
tests/canonical-fit.html presents the fitted assembly beside each solved reference for visual review. tests/tangram.html covers both levels at three viewports, shuffled starts, stable order on resize, target retention, cancellation, multiple fingers, snap transforms and exits. See TEST-REPORT.md for executed results.

## Observe in the next child trial
Watch whether shuffled pieces are still easy to acquire, whether the child searches by silhouette, whether previews communicate release, whether imprecise release still succeeds, and whether the completed board leads naturally to the Wolf/door interaction.
