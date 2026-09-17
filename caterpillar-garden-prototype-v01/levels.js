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
const arrange = (id, artwork, layout = FOUR, colourHints = false) => ({
  id, colourHints,
  pieces: artwork.map(([shape, colour], index) => ({ shape, colour, ...layout[index] })),
});

export const LEVELS = [
  arrange(1, [['circle','red'], ['square','blue'], ['triangle','yellow'], ['star','green']]),
  arrange(2, [['circle','orange'], ['square','purple'], ['triangle','green'], ['star','red']]),
  arrange(3, [['heart','blue'], ['rectangle','yellow'], ['star','orange'], ['circle','purple']]),
  arrange(4, [['circle','red'], ['square','blue'], ['triangle','yellow'], ['rectangle','green'], ['star','purple'], ['heart','orange']], SIX),
  arrange(5, [['circle','red'], ['circle','blue'], ['circle','yellow'], ['circle','green']], FOUR, true),
  arrange(6, [['circle','green'], ['square','green'], ['triangle','green'], ['star','green']]),
  arrange(7, [['heart','purple'], ['rectangle','orange'], ['triangle','blue'], ['star','red'], ['circle','yellow']], FIVE),
  arrange(8, [['circle','orange'], ['square','green'], ['triangle','purple'], ['rectangle','blue'], ['star','red'], ['heart','yellow']], SIX),
];
