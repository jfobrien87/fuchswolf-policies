// Unmodified 1254 × 1254 supplied artwork; source rectangles in native pixels.
// Local clipping polygons exclude a neighbouring ring in overlapping crop boxes.
// They run through blank space and do not alter the illustrated bodies/rings.
export const SOLAR_SHEET = './assets/solar-system.png';
export const SOLAR_SPRITES = {
  sun: { crop: [25, 20, 420, 420] },
  mercury: { crop: [512, 104, 290, 286] },
  venus: { crop: [882, 74, 328, 330] },
  earth: { crop: [48, 460, 354, 342] },
  mars: { crop: [476, 470, 315, 318] },
  jupiter: { crop: [856, 443, 362, 364] },
  saturn: { crop: [3, 837, 460, 305], clip: [[0,0],[460,0],[460,130],[400,205],[395,305],[0,305]] },
  uranus: { crop: [418, 836, 437, 326], clip: [[65,0],[437,0],[437,326],[0,326],[0,202],[65,145]] },
  neptune: { crop: [874, 838, 329, 332] },
};
export const SOLAR_ART_PENDING = false;
