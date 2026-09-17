// All radii are multiples of the visible shape's radius, independent of viewport.
export const CONFIG = Object.freeze({
  TARGET_ACQUIRE_RADIUS: 1.9,
  TARGET_RELEASE_RADIUS: 3.6,
  TARGET_SNAP_TOLERANCE: 0.12, // extra radius added to acquisition only
  TARGET_MAGNET_STRENGTH: 0.12, // render only; never distorts input/hysteresis
  TARGET_SNAP_DURATION: 230,
  GHOST_PREVIEW_ACTIVATION_THRESHOLD: 0, // ms; immediate, retain for whole lock
  HIT_PADDING: 34, // CSS pixels; scaled up on large tablets
  PICKUP_SCALE: 1.08,
  FINGER_LIFT: 16,
  RETURN_DURATION: 320,
  WOLF_ACQUIRE_RADIUS: 2.2,
  WOLF_RELEASE_RADIUS: 3.8,
  WOLF_TOUCH_MULTIPLIER: 1.4,
  WOLF_ZONE_RIGHT: 0.29,
  PARENT_HOLD_MS: 1500,
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

// Content definitions wrap the unchanged shape layouts. Input code consumes only
// these object/destination records; renderer selection does not affect matching.
export const SOLAR_ORDER = [
  "sun",
  "mercury",
  "venus",
  "earth",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
];
const trayOrder = [
  "earth",
  "saturn",
  "mercury",
  "neptune",
  "sun",
  "mars",
  "venus",
  "uranus",
  "jupiter",
];
export function matchesObject(object, accepts, mode) {
  if (mode === "shape") return object.shape === accepts.shape;
  if (mode === "shapeAndColour")
    return object.shape === accepts.shape && object.colour === accepts.colour;
  return object.id === accepts.id;
}
const shapeColours = [
  ["red"],
  ["blue", "red"],
  ["yellow", "blue", "red"],
  ["green", "yellow", "blue", "red"],
];
function colourLevel(number, items) {
  const homes = [
    [0.4, 0.28],
    [0.56, 0.72],
    [0.4, 0.72],
    [0.56, 0.28],
  ];
  const slots = [
    [0.75, 0.28],
    [0.89, 0.72],
    [0.75, 0.72],
    [0.89, 0.28],
  ];
  return {
    id: `colours-${number}`,
    title: `Colour Match ${number}`,
    group: "Colours",
    matchMode: "shapeAndColour",
    interactiveEnding: true,
    radiusWidth: 0.049,
    radiusHeight: 0.079,
    socketStyle: "colouredShape",
    portalObject: items[0][0] + "-" + items[0][1],
    objects: items.map(([shape, colour], i) => ({
      id: shape + "-" + colour,
      shape,
      colour,
      renderer: "shapeSprite",
      sprite: `shape_${shape}_${colour}`,
      visualScale: 1,
      touchMultiplier: 1,
      minimumTouchScale: 0,
      acquireMultiplier: 1,
      releaseMultiplier: 1,
      home: homes[i],
      destination: {
        id: shape + "-" + colour,
        position: slots[i],
        accepts: { shape, colour },
      },
    })),
  };
}
export const LEVEL_DEFINITIONS = [
  ...LEVELS.map((layouts, index) => ({
    id: `shapes-${index + 1}`,
    title: `Shape ${index + 1}`,
    group: "Shapes",
    matchMode: "shape",
    interactiveEnding: true,
    radiusWidth: index === 0 ? 0.072 : 0.052,
    radiusHeight: index === 0 ? 0.115 : 0.081,
    socketStyle: "shape",
    portalObject: TYPES[0],
    objects: layouts.map((layout, i) => ({
      id: TYPES[i],
      renderer: "shapeSprite",
      colour: shapeColours[index][i],
      sprite: `shape_${TYPES[i]}_${shapeColours[index][i]}`,
      shape: TYPES[i],
      visualScale: 1,
      touchMultiplier: 1,
      minimumTouchScale: 0,
      acquireMultiplier: 1,
      releaseMultiplier: 1,
      home: layout.slice(0, 2),
      destination: {
        id: TYPES[i],
        position: layout.slice(2),
        accepts: { shape: TYPES[i] },
      },
    })),
  })),
  colourLevel(1, [
    ["circle", "red"],
    ["circle", "blue"],
    ["circle", "yellow"],
    ["circle", "green"],
  ]),
  colourLevel(2, [
    ["heart", "red"],
    ["star", "blue"],
    ["triangle", "yellow"],
    ["square", "green"],
  ]),
  {
    id: "solar-system-order",
    title: "Solar System Order",
    group: "Space",
    matchMode: "id",
    interactiveEnding: true,
    radiusWidth: 0.039,
    radiusHeight: 0.07,
    companionRegion: "bottom",
    socketStyle: "neutral",
    path: true,
    portalObject: "sun",
    completionOrder: SOLAR_ORDER,
    objects: SOLAR_ORDER.map((id, index) => {
      const tray = trayOrder.indexOf(id);
      return {
        id,
        renderer: "sprite",
        sprite: id,
        visualScale: {
          sun: 1.08,
          mercury: 0.72,
          venus: 0.9,
          earth: 0.94,
          mars: 0.78,
          jupiter: 1.12,
          saturn: 1.12,
          uranus: 0.9,
          neptune: 0.9,
        }[id],
        touchMultiplier: 1,
        minimumTouchScale: 1.12,
        acquireMultiplier: 1,
        releaseMultiplier: 1,
        home:
          tray < 5
            ? [0.08 + tray * 0.21, 0.36]
            : [0.185 + (tray - 5) * 0.21, 0.54],
        destination: {
          id,
          position: [0.065 + index * (0.87 / 8), 0.14],
          accepts: { id },
        },
      };
    }),
  },
];
