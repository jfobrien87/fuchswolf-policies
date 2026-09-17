# Caterpillar Garden

An eight-level shape and colour matching game for landscape iPad. Plain HTML, CSS and JavaScript, with no build step, external requests, login, audio, menus or framework.

## Play locally

Serve this directory with any static web server, for example:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://localhost:8765. Opening `index.html` directly as a file will not support the module loading or offline cache.

The caterpillar enters, waits for every shape to be matched, celebrates, and waits with the door open. Tap or drag ahead of it anywhere in the lower play area to lead it toward the doorway. A soft ground marker follows the guide target while touching and fades quickly on release. The caterpillar walks toward the finger using the supplied animation, stops when it catches up, and never moves backwards. Lifting a finger lets it finish the current target; cancelling a gesture or leaving the page stops the guide safely. Once its face is near the doorway's front edge, input and the marker switch off and the walk-through finishes automatically. It keeps walking beyond the hidden boundary, waits 500 ms, briefly transitions, and enters the next level. Level 8 loops back to Level 1 without reloading the page. Refreshing starts at Level 1; progress is deliberately not saved. Incorrect shape drops gently return. Only one finger is tracked at a time. There are no text instructions or controls during play.

## Host on GitHub Pages and use on iPad

Follow [GITHUB-PAGES.md](GITHUB-PAGES.md) for the short setup guide. The included `.github/workflows/pages.yml` publishes the game from `main` with GitHub Actions. Put this folder's contents at your repository root and select **Settings → Pages → Source → GitHub Actions**, then run the included workflow. There is no build step or custom secret to configure.

Open the resulting HTTPS address in Safari on the iPad, in landscape, and allow the first level to finish loading online. Optionally use Safari's Add to Home Screen for a standalone view. Open that Home Screen app online once too, then test reopening it in airplane mode.

All URLs are relative, so a repository subpath works. The local Mac preview URL is only usable on the Mac; the GitHub Pages address is the portable iPad link. This project has not been published to a GitHub account.

The service worker caches the complete game and all supplied, extracted art. Offline operation requires HTTPS (or localhost), a successful initial cache, and retained browser storage. iPadOS may evict site storage. Safari's system edge gestures cannot be completely disabled by a web page; controls are inset, and in-page scrolling, selection, context menus, and zoom gestures are suppressed.

After making a release, change the `CACHE` version in `sw.js` so returning devices receive the new assets. During development, unregister the worker or clear this site's cache when changing cached files.

## Files and tuning

- `levels.js`: all level content, normalized layouts, shape and colour identities, and optional size overrides. Four-piece levels preserve the original spacing; five- and six-piece layouts use two rows. Level 5 has faint coloured insets made from the supplied artwork so its four circle sockets are visually distinguishable.
- `config.js`: initial level index, movement speed, metadata-driven frame rate override, resting position, transition and reaction timings, snap radius, hitbox padding, guide interaction area, marker radius and fade, face anchor, doorway entry threshold and tolerance, exit clearance, and `DEBUG` (off by default). Guide targets respond immediately and clamp between the current actor position and the doorway centre minus the face offset. Handoff is independently triggered near the front edge, so a target at the front of the door cannot strand the caterpillar. `GUIDE_AREA` accepts starts across the lower play area; a captured drag can continue anywhere. All movement stays on `GROUND_Y`.
- `game.js`: asset loading, data validation, pointer handling, rendering and the shared ENTERING → PLAYING → COMPLETE → GUIDE_TO_EXIT → EXITING → TRANSITIONING state machine. Each generated piece has a unique target ID, and successful drops verify both shape and colour. Every level rebuild clears movement targets, pointers, placements, animations and the open door. One animation clock pauses when the page is hidden. `snapshot()` is a read-only development inspection helper with level, piece, socket and guide state.
- `assets/manifest.json`: all 36 coloured shapes and six sockets, plus the walk sheet and metadata. All levels use this asset mapping; there are no shape-specific engine switches.
- `assets/caterpillar/walk.png` and `walk.json`: the supplied files, unchanged. The 18 frames play in order at the metadata's 8 fps only while translating. At rest the current supplied frame stays still.
- `tools/extract_assets.py`: reproducible crops and background removal from the supplied shape sheet. It removes only light neutral pixels connected to each crop's border, preserving internal artwork. Requires Pillow and a source directory argument. Original files remain untouched.
- `tests/browser.cjs`: browser interaction and offline tests. Requires Node, Playwright and Chrome; none are runtime dependencies of the game. Run `node tests/browser.cjs` while the preview is running. Set `PLAYWRIGHT_PATH` if Playwright lives outside this directory and `GAME_URL` for a different preview URL.
- `tests/levels.cjs`: plays all eight levels offline using browser-controlled time and real pointer events. Checks the requested contents, clear layouts, all 12 incorrect colour combinations on Level 5, full exits, transitions and the Level 8 → 1 wrap. Run `node tests/levels.cjs` with the same setup.

The logical game area is 1280 × 800 and scales uniformly with letterboxing. The original sprite proportions are preserved. The doorway clips the caterpillar inside its opening instead of fading it away. All artwork is preloaded before the entry sequence begins.

## Add or adjust a level

Append an object to `LEVELS` in `levels.js`. For example:

```js
{
  id: 9,
  colourHints: false,
  pieces: [
    { shape: 'heart', colour: 'purple',
      start: { x: .5, y: .65 }, socket: { x: .5, y: .3 }, size: 126 },
    // Add more pieces with their own positions.
  ],
}
```

Positions are fractions from 0 to 1, relative to the logical play area. `size` is optional and uses logical pixels; the corresponding socket scales proportionally. Reuse any of the supplied six shapes and six colours without adding assets. If introducing artwork, add its paths to `assets/manifest.json`. The loader validates artwork availability, level IDs, coordinates and sizes. Bump the cache version in `sw.js` when publishing changed level data. The engine automatically progresses through the full array; no engine change is needed to append Level 9.

For development, set `DEBUG: true` and `DEBUG_START_LEVEL: 5` in `config.js` to begin at Level 5 and see hitboxes/targets. Restore `DEBUG: false` for normal play. The debug start is ignored in normal mode; `INITIAL_LEVEL_INDEX: 0` begins at Level 1. There is no in-game selector.

## Verification

Automated Chrome testing covers incorrect drops, touch offset, extra fingers, cancellation, a generous snap, locked completed pieces, waiting for the child, tap-to-follow, continued dragging, marker tracking and fading, freezing at a local target, no backwards travel, guide cancellation and focus loss, touches at and near the door's front edge, uninterrupted exit movement and sprite frames, complete disappearance before transition, all eight levels offline, colour identity, wraparound, two tablet sizes, actual browser touch events and fresh offline visits. Screenshots were visually reviewed. Physical iPad/Safari testing remains a final device check.
