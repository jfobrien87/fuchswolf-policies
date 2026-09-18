// Positions are fractions of the logical play area. Art sizes are set in config.js;
// a piece may override `size` in logical pixels without changing the engine.
const FOUR = [
  { start: { x: .36328125, y: .6125 }, socket: { x: .33984375, y: .33125 } },
  { start: { x: .49609375, y: .6125 }, socket: { x: .5, y: .33125 } },
  { start: { x: .62890625, y: .6125 }, socket: { x: .66015625, y: .33125 } },
  { start: { x: .76171875, y: .6125 }, socket: { x: .8203125, y: .33125 } },
];
// Two rows keep six full-sized pieces spacious without approaching the character or door.
const SIX = [
  { start: { x: .37109375, y: .60625 }, socket: { x: .37109375, y: .175 } },
  { start: { x: .56640625, y: .60625 }, socket: { x: .56640625, y: .175 } },
  { start: { x: .76171875, y: .60625 }, socket: { x: .76171875, y: .175 } },
  { start: { x: .37109375, y: .8125 }, socket: { x: .37109375, y: .3875 } },
  { start: { x: .56640625, y: .8125 }, socket: { x: .56640625, y: .3875 } },
  { start: { x: .76171875, y: .8125 }, socket: { x: .76171875, y: .3875 } },
];
const FIVE = [
  ...SIX.slice(0, 3),
  { start: { x: .45703125, y: .8125 }, socket: { x: .45703125, y: .3875 } },
  { start: { x: .671875, y: .8125 }, socket: { x: .671875, y: .3875 } },
];
const STAGGERED_SIX = SIX.map((slot, index) => ({
  start: slot.start,
  socket: [
    { x: 455 / 1280, y: 140 / 800 }, { x: 700 / 1280, y: 165 / 800 },
    { x: 960 / 1280, y: 140 / 800 }, { x: 485 / 1280, y: 320 / 800 },
    { x: 750 / 1280, y: 335 / 800 }, { x: 1000 / 1280, y: 320 / 800 },
  ][index],
}));
// Four above, three below: the seventh piece keeps the same full-sized artwork.
const SEVEN = [
  [440, 480, 420, 140], [625, 480, 625, 140],
  [810, 480, 830, 140], [995, 480, 1035, 140],
  [470, 660, 485, 310], [725, 660, 725, 310], [980, 660, 965, 310],
].map(([x, y, sx, sy]) => ({
  start: { x: x / 1280, y: y / 800 }, socket: { x: sx / 1280, y: sy / 800 },
}));
const arrange = (id, artwork, layout = FOUR, colourHints = false) => ({
  id, colourHints,
  pieces: artwork.map(([shape, colour], index) => ({ shape, colour, socket: { ...layout[index].socket } })),
  startSlots: layout.map(slot => ({ ...slot.start })),
});

// Fisher–Yates on a copy leaves the fixed socket/identity order untouched.
export function shufflePieces(pieces, random = Math.random) {
  const shuffled = [...pieces];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  // A simple fallback prevents the entire original order, without requiring
  // every individual piece to move to a different column.
  if (shuffled.length > 1 && shuffled.every((piece, i) => piece === pieces[i])) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return shuffled;
}

export const LEVELS = [
  arrange(1, [['circle','red'], ['square','blue'], ['triangle','yellow'], ['star','green']]),
  arrange(2, [['circle','orange'], ['square','purple'], ['triangle','green'], ['star','red']]),
  arrange(3, [['heart','blue'], ['rectangle','yellow'], ['star','orange'], ['circle','purple']]),
  arrange(4, [['circle','red'], ['square','blue'], ['triangle','yellow'], ['rectangle','green'], ['star','purple'], ['heart','orange']], SIX),
  arrange(5, [['circle','red'], ['circle','blue'], ['circle','yellow'], ['circle','green']], FOUR, true),
  arrange(6, [['circle','green'], ['square','green'], ['triangle','green'], ['star','green']]),
  arrange(7, [['heart','purple'], ['rectangle','orange'], ['triangle','blue'], ['star','red'], ['circle','yellow']], FIVE),
  arrange(8, [['circle','orange'], ['square','green'], ['triangle','purple'], ['rectangle','blue'], ['star','red'], ['heart','yellow']], SIX),
  arrange(9, [['star','red'], ['star','blue'], ['star','yellow'], ['star','green'], ['star','purple']], FIVE, true),
  arrange(10, [['circle','orange'], ['square','orange'], ['triangle','orange'], ['rectangle','orange'], ['heart','orange']], FIVE),
  arrange(11, [['circle','purple'], ['square','yellow'], ['triangle','red'], ['rectangle','blue'], ['star','green'], ['heart','orange']], SIX),
  arrange(12, [['circle','red'], ['circle','blue'], ['square','yellow'], ['square','green'], ['triangle','purple'], ['triangle','orange']], SIX, true),
  arrange(13, [['heart','red'], ['heart','blue'], ['heart','yellow'], ['heart','green'], ['heart','purple'], ['heart','orange']], SIX, true),
  arrange(14, [['rectangle','red'], ['rectangle','blue'], ['rectangle','yellow'], ['rectangle','green'], ['rectangle','purple'], ['rectangle','orange']], SIX, true),
  arrange(15, [['circle','green'], ['square','orange'], ['triangle','blue'], ['rectangle','purple'], ['star','yellow'], ['heart','red']], STAGGERED_SIX),
  arrange(16, [['circle','red'], ['square','blue'], ['triangle','yellow'], ['rectangle','green'], ['star','purple'], ['heart','orange'], ['circle','blue']], SEVEN, true),
];
