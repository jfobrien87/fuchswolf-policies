// Native source coordinates, with margins preserving the painted edges.
export const SHAPE_SHEET = "./assets/shapes.png";
export const SHAPES = [
  "circle",
  "square",
  "triangle",
  "star",
  "heart",
  "diamond",
];
export const COLOURS = ["red", "blue", "yellow", "green"];
const columns = [
  [40, 217],
  [269, 216],
  [491, 214],
  [711, 218],
  [939, 235],
];
const rows = [
  [0, 200],
  [201, 189],
  [395, 183],
  [584, 207],
  [798, 193],
  [991, 236],
];
export const SHAPE_SPRITES = Object.fromEntries(
  SHAPES.flatMap((shape, row) =>
    [...COLOURS, "neutral"].map((colour, col) => {
      const [x, w] = columns[col],
        [y, h] = rows[row];
      return [
        colour === "neutral" ? `target_${shape}` : `shape_${shape}_${colour}`,
        { crop: [x, y, w, h] },
      ];
    }),
  ),
);
