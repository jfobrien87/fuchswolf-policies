# Prototype 01 — verification report

Executed 11–12 September 2026 in the Codex in-app desktop browser. The optional test pages run the actual application inside browser frames. They send Pointer Events through its listeners and let its normal animation/level state machine complete.

## Passed

At **1180 × 820**, **900 × 600**, and **768 × 1024** CSS-pixel frame sizes:

- Immediate pointer-down acquisition using a point outside the visible shape but inside its padded touch area.
- Extra pointer-down/up events cannot steal or release the active gesture.
- Fast moves directly from source to target, outside the original hit area.
- Three repeated pickup/release attempts without state corruption.
- Empty-space release and smooth return.
- An incorrect shape destination and gentle return.
- Target acquisition and retained candidate state.
- Deliberate large movement away cancels the target; release afterward is logged as a lost-target release.
- **Critical wobble case:** acquire, move to 1.95 shape radii away (outside the 1.72-radius acquisition zone), then release at a slightly different position; the retained placement succeeds.
- Pointer cancellation with and without an acquired target returns the piece without completing it.
- Resize during a gesture cancels it and recalculates the layout.
- Ordinary Wolf ghost stays outside puzzle space; the real Wolf remains at the origin during dragging.
- Valid Wolf relocation animates to a safe destination. A release in puzzle space leaves Wolf safely outside it.
- Source hitboxes remain separated from one another and from Wolf's protected strip. Slots remain outside the strip.
- All ten matches across four deterministic levels.
- All four Wolf-to-portal interactions, the three next-level transitions and final reunion.
- A tap on a pup in the final vignette triggers a new friendship response.
- Restart preserves history; telemetry reset starts a fresh session and Level 1.
- The parent hotspot stays closed for a short touch and opens after four seconds.

The pure target resolver separately passed acquisition, compatible-target switching, retention and cancellation tests. The deterministic game levels have one target per shape, so compatible-target switching uses a two-target fixture.

## Real browser pointer check

A browser-driven mouse drag moved the Level 1 circle from its source to the slot and completed the placement. The release telemetry recorded both **`locked: true`** and **`captured: true`**, confirming actual browser pointer capture through release, in addition to the synthetic-event checks.

## Offline and visual checks

The local server was stopped after caching. A full reload at the application root still displayed the game, and a real browser drag completed Level 1 and revealed its portal without the server. Wolf’s portal interaction also completed offline and Level 2 appeared. This validates the installed desktop service-worker cache, not iPad Home Screen storage retention.

All three Wolf sprite crops were visually inspected; stray caption remnants were removed and each pose preserves its source aspect ratio. The final Wolf/Fox vignette was visually checked. An additional full walkthrough resized the frame before each portal drop and during every Wolf travel animation; all four transitions reached the expected next state.

## Simulated load

The 900 × 600 test introduced **20 ms main-thread stalls every 70 ms** while completing the full regression sequence. It still passed all assertions.

Observed requestAnimationFrame intervals on this desktop:

| Frame | Median | 95th percentile |
| --- | ---: | ---: |
| 1180 × 820 | 8 ms | 9 ms |
| 900 × 600, with artificial stalls | 8 ms | 16 ms |
| 768 × 1024 | 8 ms | 9 ms |

These are approximate callback intervals on a high-refresh desktop. They are **not iPad performance measurements** or touch-to-photon latency measurements. Artificial stalls are not a substitute for testing a slower tablet.

## Validation limits

- A physical iPad Air M2 was not available for testing.
- Automated standalone Chromium and WebKit launches were blocked by the host process sandbox. Native Safari control could not proceed because Accessibility/Screen Recording permissions were pending. The passing tests above were run in the in-app desktop browser.
- Synthetic multi-pointer and cancellation tests validate the application's event handling, not OS-level touch delivery or palm behavior.
- Physical release wobble, Safari edge gestures, app switching, sound audibility and first-touch audio unlock still need a device smoke test.
- Home Screen installation, clipboard/download UI and long-term cache/storage retention need validation in the actual iPad context.
- No known reproducible iPad-specific defect is claimed fixed or ruled out by these desktop tests.

## Suggested device smoke test before involving the child

Open the hosted HTTPS version and try one drag with substantial release wobble. Cancel a drag by switching away and back. Try two fingers. Complete one portal. Check the four-second parent hold and JSON export. Open the Home Screen version online, then relaunch in airplane mode. Use `tests/` for repeatable application-level checks if helpful.
