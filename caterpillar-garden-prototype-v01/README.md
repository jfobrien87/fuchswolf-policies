# Caterpillar Garden

A sixteen-level shape and colour matching game for landscape iPad, with looping background music and gentle interaction sounds. Plain HTML, CSS and JavaScript, with no build step, external requests, login, menus or framework.

## Play locally

Serve this directory with any static web server, for example:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://localhost:8765. Opening `index.html` directly as a file will not support the module loading or offline cache.

The caterpillar enters, waits for every shape to be matched, celebrates, and waits with the door open. Tap or drag ahead of it anywhere in the lower play area to lead it toward the doorway. A soft ground marker follows the guide target while touching and fades quickly on release. The caterpillar walks toward the finger using the supplied animation, stops when it catches up, and never moves backwards. Lifting a finger lets it finish the current target; cancelling a gesture or leaving the page stops the guide safely. Once its face is near the doorway's front edge, input and the marker switch off and the walk-through finishes automatically. It keeps walking beyond the hidden boundary, waits 500 ms, briefly transitions, and enters the next level. Level 16 loops back to Level 1 without reloading the page. Refreshing starts at Level 1; progress is deliberately not saved. Pieces shuffle among fixed safe starting slots on every level load, while sockets stay fixed. The complete original piece order is avoided; individual pieces may still share a column with their target. Incorrect shape drops gently return to their assigned shuffled slot. Tap the resting caterpillar during the puzzle to greet it with a gentle, silent 650 ms happy bounce. Repeated taps are ignored until the reaction finishes; pieces keep their normal drag priority. The greeting is disabled during entry, completion, guiding and exit. Only one finger is tracked at a time. There are no text instructions; the only corner control is the sound icon.

## Sound

Tap the speaker in the upper-right corner to mute or unmute. Hold it for at least 0.7 seconds, then release, to reset just the audio. Its outline fills during the hold. Recovery preserves the mute preference and attempts to resume the music position without changing the puzzle or level.

Music uses the attached `music_caterpillar_garden_game.mp3` unchanged, bundled as `assets/audio/music.mp3` (the supplied track requested as Tapped Out in the brief). A single persistent looping media element continues across all sixteen levels. Muting pauses at the current position and silences/stops effects immediately. Unmuting resumes it. The mute preference is saved locally; audio errors and game progress are not saved.

The five original, short WAV placeholders cover pickup, correct placement, a gentle incorrect-drop tick, the happy reaction and door opening. No extra guide or exit sounds were added. Replace files via `assets/manifest.json` without changing gameplay logic. Regenerate the placeholders with `python3 tools/generate_sfx.py` if desired; no synthesis runs in the game.

`audio.js` owns the music player, Web Audio gains, predecoded effects, voice limit, mute preference and recovery. The music gain is 0.30 and the effect gain is 0.70, with individual multipliers in `config.js` under `AUDIO`. Routing music through a gain node avoids relying on mobile media-element volume controls. The sound button contains inline SVG icons, so no icon network requests are needed.

Autoplay is attempted when ready. If denied, normal trusted game touches retry playback and resume the audio context; the game needs no start screen. See [MDN's autoplay guidance](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay). Audio initialization failures do not block gameplay. Returning to the page attempts recovery; a fresh touch or the hold-release control can recover an interrupted browser audio session. Device silent mode, OS interruptions and physical iPad behaviour still need on-device checking.

The service worker caches the MP3 and all five effects and serves HTTP byte-range responses from the full cached files, including Safari's small media probe requests. This follows the range-request handling described by [WebKit](https://bugs.webkit.org/show_bug.cgi?id=184447). First-load media caching happens before audio initialization to avoid duplicate music downloads.

## Host on GitHub Pages and use on iPad

Follow [GITHUB-PAGES.md](GITHUB-PAGES.md) for the short setup guide. The included `.github/workflows/pages.yml` publishes the game from `main` with GitHub Actions. Put this folder's contents at your repository root and select **Settings → Pages → Source → GitHub Actions**, then run the included workflow. There is no build step or custom secret to configure.

Open the resulting HTTPS address in Safari on the iPad, in landscape, and allow the first level to finish loading online. Optionally use Safari's Add to Home Screen for a standalone view. Open that Home Screen app online once too, then test reopening it in airplane mode.

All URLs are relative, so a repository subpath works. The local Mac preview URL is only usable on the Mac; the GitHub Pages address is the portable iPad link. This project has not been published to a GitHub account.

The service worker caches the complete game and all supplied, extracted art. Offline operation requires HTTPS (or localhost), a successful initial cache, and retained browser storage. iPadOS may evict site storage. Safari's system edge gestures cannot be completely disabled by a web page; controls are inset, and in-page scrolling, selection, context menus, and zoom gestures are suppressed.

After making a release, change the `CACHE` version in `sw.js` so returning devices receive the new assets. During development, unregister the worker or clear this site's cache when changing cached files.

## Files and tuning

- `levels.js`: all 16 levels, normalized socket positions and independent safe starting slots, shape and colour identities, and optional size overrides. The original eight socket layouts are unchanged. Five- and six-piece layouts use two rows, Level 15 staggers its sockets, and Level 16 fits seven full-sized pieces across two rows. Levels with repeated shapes have faint coloured insets made from the supplied artwork. Fisher–Yates shuffles a copy of the piece order on each load, with a simple swap if the entire order is unchanged. Shared level data is never mutated.
- `config.js`: initial level index, movement speed, metadata-driven frame rate override, resting position, transition and reaction timings, snap radius, hitbox padding, guide interaction area, marker radius and fade, face anchor, doorway entry threshold and tolerance, exit clearance, and `DEBUG` (off by default). Guide targets respond immediately and clamp between the current actor position and the doorway centre minus the face offset. Handoff is independently triggered near the front edge, so a target at the front of the door cannot strand the caterpillar. `GUIDE_AREA` accepts starts across the lower play area; a captured drag can continue anywhere. All movement stays on `GROUND_Y`.
- `game.js`: asset loading, data validation, pointer handling, rendering and the shared ENTERING → PLAYING → COMPLETE → GUIDE_TO_EXIT → EXITING → TRANSITIONING state machine. Each generated piece has a unique target ID, and successful drops verify both shape and colour. Every level rebuild clears movement targets, pointers, placements, animations and the open door. One animation clock pauses when the page is hidden. `snapshot()` is a read-only development inspection helper with level, piece, socket and guide state, including assigned starting slots.
- `assets/manifest.json`: all 36 coloured shapes and six sockets, the walk sheet and metadata, and music/effect paths. All levels use this asset mapping; there are no shape-specific engine switches.
- `assets/caterpillar/walk.png` and `walk.json`: the supplied files, unchanged. The 18 frames play in order at the metadata's 8 fps only while translating. At rest the current supplied frame stays still.
- `tools/extract_assets.py`: reproducible crops and background removal from the supplied shape sheet. It removes only light neutral pixels connected to each crop's border, preserving internal artwork. Requires Pillow and a source directory argument. Original files remain untouched.
- `tests/browser.cjs`: browser interaction and offline tests. Requires Node, Playwright and Chrome; none are runtime dependencies of the game. Run `node tests/browser.cjs` while the preview is running. Set `PLAYWRIGHT_PATH` if Playwright lives outside this directory and `GAME_URL` for a different preview URL.
- `tests/levels.cjs`: plays all sixteen levels offline using browser-controlled time and real pointer events. Checks the requested contents, clear full-size layouts, shuffled return positions, every same-shape wrong-colour combination, full exits, transitions and the Level 16 → 1 wrap. Run `node tests/levels.cjs` with the same setup.
- `tests/greeting.cjs`: checks real touch greetings, their duration and return to the exact resting pose, rapid taps, silent reactions, drag priority, movement exclusions, progression and offline reload. An injected test-only `END_FREEPLAY` state verifies the greeting guard; this edition still loops after Level 16 and does not include a final free-play scene. Run `node tests/greeting.cjs` with the same setup.
- `tests/shuffle.cjs`: checks 16,000 seeded shuffles, original socket positions, all 16 debug start levels and 30 reloads of each level. Run `node tests/shuffle.cjs` with the same setup.
- `tests/audio.cjs`: checks a simulated autoplay denial followed by a real first gesture, sound events, mouse and touch toggles, mute persistence, music-position preservation, recovery of a closed audio context, offline byte ranges, track looping and music continuity across a level change. Run `node tests/audio.cjs` with the same setup.

The logical game area is 1280 × 800 and scales uniformly with letterboxing. The original sprite proportions are preserved. The doorway clips the caterpillar inside its opening instead of fading it away. All artwork is preloaded before the entry sequence begins.

## Add or adjust a level

Append an object to `LEVELS` in `levels.js`. For example:

```js
{
  id: 17,
  colourHints: false,
  pieces: [
    { shape: 'heart', colour: 'purple', socket: { x: .4, y: .3 } },
    { shape: 'star', colour: 'orange', socket: { x: .7, y: .3 } },
  ],
  startSlots: [
    { x: .4, y: .65 },
    { x: .7, y: .65 },
  ],
}
```

Socket positions stay attached to piece identities. `startSlots` is an independent array with exactly one slot per piece; any piece can occupy any slot. Positions are fractions from 0 to 1, relative to the logical play area. An optional piece `size` uses logical pixels; the corresponding socket scales proportionally. Space every starting slot for the largest piece in that level, keeping the caterpillar, doorway and screen edges clear. The included levels all retain the original 126-pixel piece size, hitbox padding and snap radius.

Reuse any of the supplied six shapes and six colours without adding assets. Use `colourHints: true` when repeated shapes need their socket colours distinguished. If introducing artwork, add its paths to `assets/manifest.json`. The loader validates artwork availability, level IDs, slot counts, coordinates and sizes. Bump the cache version in `sw.js` when publishing changed level data. The engine automatically progresses through the full array; no core code change is needed to append Level 17.

For development, set `DEBUG: true` and `DEBUG_START_LEVEL` to any number from 1 through 16 in `config.js` to start there and see hitboxes/targets. With debug enabled, call `reloadCurrentLevel()` in the browser console to restart and reshuffle that level without reloading the page or resetting audio. Each restart is an independent shuffle, so an earlier order may recur. Restore `DEBUG: false` for normal play; the console helper is then absent. The debug start is ignored in normal mode; `INITIAL_LEVEL_INDEX: 0` begins at Level 1. There is no in-game selector.

## Verification

Automated Chrome testing covers incorrect drops, touch offset, extra fingers, cancellation, a generous snap, locked completed pieces, waiting for the child, tap-to-follow, continued dragging, marker tracking and fading, freezing at a local target, no backwards travel, guide cancellation and focus loss, touches at and near the door's front edge, uninterrupted exit movement and sprite frames, complete disappearance before transition, all sixteen levels offline, colour identity, wraparound, two tablet sizes, actual browser touch events and fresh offline visits. Screenshots were visually reviewed. Physical iPad/Safari testing remains a final device check.
