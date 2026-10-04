// Canonical 1448×1086 references. All vertices are native image coordinates.
// source: loose-piece outline; reference: corresponding solved outline;
// socket: that outline registered to the empty board. No guessed minimum-fit boxes.
const piece = (id, source, reference, socket = reference) => ({
  id,
  source,
  reference,
  socket,
  rotation: 0,
});
export const TANGRAM_ART = {
  boat: {
    url: "./assets/boat_tangram_pieces.png",
    boardURL: "./assets/boat_tangram_empty_board.png",
    solvedURL: "./assets/boat_tangram_solved.png",
    board: [20, 104, 1408, 847],
    pieces: [
      piece(
        "blue-hull",
        [
          [28, 476],
          [401, 476],
          [401, 644],
          [159, 644],
        ],
        [
          [74, 611],
          [695, 611],
          [695, 903],
          [307, 903],
        ],
      ),
      piece(
        "red-sail",
        [
          [422, 641],
          [659, 393],
          [659, 641],
        ],
        [
          [279, 576],
          [695, 145],
          [695, 577],
        ],
      ),
      piece(
        "yellow-sail",
        [
          [695, 393],
          [824, 598],
          [824, 642],
          [695, 642],
        ],
        [
          [737, 145],
          [942, 499],
          [942, 577],
          [737, 577],
        ],
      ),
      piece(
        "green-hull",
        [
          [1082, 476],
          [1420, 476],
          [1275, 644],
          [1082, 644],
        ],
        [
          [737, 611],
          [1371, 611],
          [1119, 903],
          [737, 903],
        ],
      ),
      piece(
        "orange-cabin",
        [
          [848, 530],
          [1053, 530],
          [1053, 643],
          [848, 643],
        ],
        [
          [973, 414],
          [1279, 414],
          [1279, 576],
          [973, 576],
        ],
      ),
    ],
  },
  house: {
    url: "./assets/house_tangram_pieces.png",
    boardURL: "./assets/house_tangram_board.png",
    solvedURL: "./assets/house_tangram_solved.png",
    board: [232, 104, 988, 866],
    pieces: [
      piece(
        "red-wall",
        [
          [845, 406],
          [1093, 406],
          [1093, 663],
          [845, 663],
        ],
        [
          [306, 551],
          [706, 551],
          [706, 932],
          [306, 932],
        ],
        [
          [328, 558],
          [703, 558],
          [703, 918],
          [328, 918],
        ],
      ),
      piece(
        "blue-roof",
        [
          [44, 663],
          [329, 401],
          [329, 663],
        ],
        [
          [294, 510],
          [704, 135],
          [704, 511],
        ],
        [
          [317, 518],
          [702, 158],
          [702, 520],
        ],
      ),
      piece(
        "yellow-roof",
        [
          [383, 401],
          [650, 663],
          [383, 663],
        ],
        [
          [742, 137],
          [1119, 510],
          [742, 511],
        ],
        [
          [739, 158],
          [1120, 519],
          [739, 520],
        ],
      ),
      piece(
        "green-wall",
        [
          [1150, 406],
          [1400, 406],
          [1400, 663],
          [1150, 663],
        ],
        [
          [744, 551],
          [1136, 551],
          [1136, 932],
          [744, 932],
        ],
        [
          [739, 558],
          [1125, 558],
          [1125, 918],
          [739, 918],
        ],
      ),
      piece(
        "orange-chimney",
        [
          [674, 435],
          [788, 435],
          [788, 652],
          [674, 553],
        ],
        [
          [1014, 168],
          [1141, 168],
          [1141, 450],
          [1014, 334],
        ],
        [
          [1003, 194],
          [1128, 194],
          [1128, 467],
          [1003, 356],
        ],
      ),
    ],
  },
};
function bounds(points, pad = 3) {
  const xs = points.map((p) => p[0]),
    ys = points.map((p) => p[1]);
  const x = Math.floor(Math.min(...xs)) - pad,
    y = Math.floor(Math.min(...ys)) - pad;
  return [
    x,
    y,
    Math.ceil(Math.max(...xs)) - x + pad,
    Math.ceil(Math.max(...ys)) - y + pad,
  ];
}
// Prepare static fitted sprites once from the loose artwork. Piecewise affine
// registration keeps every outline vertex on the authored socket boundary.
// This is asset preparation, not per-frame physics or procedural illustration.
// Include the painted bevel outside the registration vertices. Parallel edge
// expansion preserves rounded source corners; the white sheet is removed below.
function expandedOutline(points, padding = 4) {
  const edges = points.map((a, i) => {
    const b = points[(i + 1) % points.length],
      dx = b[0] - a[0],
      dy = b[1] - a[1],
      length = Math.hypot(dx, dy);
    return {
      a: [a[0] + (dy / length) * padding, a[1] - (dx / length) * padding],
      d: [dx, dy],
    };
  });
  return edges.map((edge, i) => {
    const prev = edges[(i + edges.length - 1) % edges.length],
      [dx, dy] = edge.d,
      [px, py] = prev.d;
    const t =
      ((prev.a[0] - edge.a[0]) * py - (prev.a[1] - edge.a[1]) * px) /
      (dx * py - dy * px);
    return [edge.a[0] + t * dx, edge.a[1] + t * dy];
  });
}
const fitted = new Map();
function fittedSprite(image, theme, id) {
  const key = theme + ":" + id;
  if (fitted.has(key)) return fitted.get(key);
  const p = TANGRAM_ART[theme].pieces.find((p) => p.id === id),
    b = bounds(p.socket),
    c = document.createElement("canvas");
  c.width = b[2];
  c.height = b[3];
  const g = c.getContext("2d");
  const source = expandedOutline(p.source);
  const dst = p.socket.map(([x, y]) => [x - b[0], y - b[1]]);
  // The overall polygon clips tiny triangle overlap used to avoid hairline seams.
  g.save();
  g.beginPath();
  dst.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.clip();
  for (let i = 1; i < dst.length - 1; i++) {
    const src = [source[0], source[i], source[i + 1]],
      d = [dst[0], dst[i], dst[i + 1]];
    const [s0, s1, s2] = src,
      [d0, d1, d2] = d,
      ux = s1[0] - s0[0],
      uy = s1[1] - s0[1],
      vx = s2[0] - s0[0],
      vy = s2[1] - s0[1],
      det = ux * vy - uy * vx;
    const ax = d1[0] - d0[0],
      ay = d1[1] - d0[1],
      bx = d2[0] - d0[0],
      by = d2[1] - d0[1];
    const a = (ax * vy - bx * uy) / det,
      bm = (ay * vy - by * uy) / det,
      cc = (bx * ux - ax * vx) / det,
      dd = (by * ux - ay * vx) / det;
    const mx = (d0[0] + d1[0] + d2[0]) / 3,
      my = (d0[1] + d1[1] + d2[1]) / 3;
    g.save();
    g.beginPath();
    d.forEach(([x, y], j) => {
      const len = Math.hypot(x - mx, y - my),
        xx = x + ((x - mx) / len) * 0.7,
        yy = y + ((y - my) / len) * 0.7;
      j ? g.lineTo(xx, yy) : g.moveTo(xx, yy);
    });
    g.closePath();
    g.clip();
    g.setTransform(
      a,
      bm,
      cc,
      dd,
      d0[0] - a * s0[0] - cc * s0[1],
      d0[1] - bm * s0[0] - dd * s0[1],
    );
    g.drawImage(image, 0, 0);
    g.restore();
  }
  g.restore();
  const pixels = g.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const light = Math.min(
      pixels.data[i],
      pixels.data[i + 1],
      pixels.data[i + 2],
    );
    if (light > 235) pixels.data[i + 3] *= Math.max(0, (250 - light) / 15);
  }
  g.putImageData(pixels, 0, 0);
  fitted.set(key, c);
  return c;
}
export function boardGeometry(theme, w, h) {
  const b = TANGRAM_ART[theme].board,
    scale = Math.min((w * 0.55) / b[2], (h * 0.58) / b[3]);
  return {
    x: w * 0.3 - (b[2] * scale) / 2,
    y: h * 0.32 - (b[3] * scale) / 2,
    w: b[2] * scale,
    h: b[3] * scale,
    scale,
  };
}
export function tangramMetrics(definition, w, h) {
  const art = TANGRAM_ART[definition.theme],
    p = art.pieces.find((p) => p.id === definition.id),
    board = boardGeometry(definition.theme, w, h),
    b = bounds(p.socket);
  const homeScale = Math.min((w * 0.15) / b[2], (h * 0.15) / b[3]);
  return {
    board,
    piece: { ...p, crop: [0, 0, b[2], b[3]] },
    homeScale,
    solvedScale: board.scale,
    x: board.x + (b[0] - art.board[0] + b[2] / 2) * board.scale,
    y: board.y + (b[1] - art.board[1] + b[3] / 2) * board.scale,
    width: b[2] * homeScale,
    height: b[3] * homeScale,
  };
}
export function drawTangramBoard(ctx, image, theme, w, h) {
  const b = TANGRAM_ART[theme].board,
    g = boardGeometry(theme, w, h);
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(image, ...b, g.x, g.y, g.w, g.h);
  ctx.restore();
}
export function drawTangramPiece(
  ctx,
  image,
  definition,
  x,
  y,
  metrics,
  angle = 0,
  pixelScale = metrics.homeScale,
  alpha = 1,
  lift = 1,
) {
  const c = fittedSprite(image, definition.theme, definition.id);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "source-over";
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(lift, lift);
  ctx.drawImage(
    c,
    (-c.width * pixelScale) / 2,
    (-c.height * pixelScale) / 2,
    c.width * pixelScale,
    c.height * pixelScale,
  );
  ctx.restore();
}
export const TANGRAM_TRAY = [
  [0.68, 0.12],
  [0.88, 0.12],
  [0.68, 0.31],
  [0.88, 0.31],
  [0.78, 0.48],
];
export function shuffledTangramTray(previous = [], random = Math.random) {
  const order = [0, 1, 2, 3, 4];
  for (let i = 4; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (order.every((v, i) => v === previous[i])) order.push(order.shift());
  return order;
}
export function tangramLevel(theme, title) {
  return {
    id: `tangram-${theme}`,
    title,
    group: "Tangrams",
    luckyDipEligible: true,
    matchMode: "id",
    tangram: theme,
    layoutProfile: "bottomCompanion",
    endingMode: "interactive",
    holding: { variant: "path" },
    exitType: "genericDoor",
    radiusWidth: 0.046,
    radiusHeight: 0.075,
    socketStyle: "tangram",
    objects: TANGRAM_ART[theme].pieces.map((p, i) => ({
      id: p.id,
      theme,
      renderer: "tangram",
      sprite: p.id,
      visualScale: 1,
      touchMultiplier: 1.05,
      minimumTouchScale: 1,
      acquireMultiplier: 1.2,
      releaseMultiplier: 1.2,
      home: TANGRAM_TRAY[i],
      destination: {
        id: p.id,
        position: [0, 0],
        accepts: { id: p.id },
        rotation: 0,
      },
    })),
  };
}
