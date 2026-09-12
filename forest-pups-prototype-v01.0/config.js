// All radii are multiples of the visible shape's radius, independent of viewport.
export const CONFIG = Object.freeze({
  TARGET_ACQUIRE_RADIUS: 1.6,
  TARGET_RELEASE_RADIUS: 2.65,
  TARGET_SNAP_TOLERANCE: 0.12, // extra radius added to acquisition only
  TARGET_MAGNET_STRENGTH: 0.12, // render only; never distorts input/hysteresis
  TARGET_SNAP_DURATION: 230,
  GHOST_PREVIEW_ACTIVATION_THRESHOLD: 0, // ms; immediate, retain for whole lock
  HIT_PADDING: 20, // CSS pixels; scaled up on large tablets
  PICKUP_SCALE: 1.08,
  FINGER_LIFT: 16,
  RETURN_DURATION: 320,
  WOLF_ACQUIRE_RADIUS: 1.85,
  WOLF_RELEASE_RADIUS: 2.9,
  PARENT_HOLD_MS: 4000,
  HINT_LOOK_MS: 6500,
  HINT_PIECE_MS: 15000,
  PATH_SAMPLE_MS: 50,
  MAX_EVENTS: 15000,
});
export const TYPES = ["circle", "triangle", "square", "star"];
// [source x,y, destination x,y], normalized inside the game canvas.
export const LEVELS = [
  [[0.43, 0.54, 0.77, 0.46]],
  [
    [0.43, 0.3, 0.77, 0.3],
    [0.43, 0.71, 0.77, 0.71],
  ],
  [
    [0.43, 0.24, 0.79, 0.72],
    [0.51, 0.51, 0.75, 0.25],
    [0.4, 0.77, 0.83, 0.48],
  ],
  [
    [0.39, 0.25, 0.75, 0.74],
    [0.55, 0.74, 0.71, 0.25],
    [0.39, 0.66, 0.87, 0.49],
    [0.55, 0.33, 0.88, 0.24],
  ],
];
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
// Pure stateful rule. Pointer-up MUST consume the returned lock without retesting.
export function resolveTarget(
  point,
  candidates,
  previous,
  acquireRadius,
  releaseRadius,
) {
  const near = candidates
    .filter((t) => distance(point, t) <= acquireRadius)
    .sort((a, b) => distance(point, a) - distance(point, b))[0];
  if (near && near.id !== previous?.id) return near;
  if (previous && distance(point, previous) <= releaseRadius) return previous;
  return near || null;
}
