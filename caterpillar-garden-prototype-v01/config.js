// All distances are in the fixed logical play area, independent of screen size.
export const CONFIG = {
  DEBUG: false,
  INITIAL_LEVEL_INDEX: 0,
  DEBUG_START_LEVEL: 1, // One-based; only used when DEBUG is true.
  WIDTH: 1280,
  HEIGHT: 800,
  CATERPILLAR_WALK_SPEED: 100, // logical pixels / second
  ANIMATION_FPS: null, // null uses recommended_fps from the supplied metadata
  CATERPILLAR_REST_X: 65,
  CATERPILLAR_WIDTH: 295,
  GROUND_Y: 663,
  GUIDE_AREA: { x: 0, y: 380, width: 1280, height: 420 },
  GUIDE_HEAD_OFFSET_RATIO: 0.9, // Lead the face toward the finger, not the sprite's left edge.
  GUIDE_MARKER_RADIUS: 46,
  GUIDE_MARKER_FADE_DURATION: 240,
  DOOR_ENTRY_X: 1102, // Front edge of the opening, measured at the caterpillar's face.
  DOOR_ENTRY_TOLERANCE: 28, // A near-door drop also hands off to the automatic exit.
  EXIT_CLEARANCE: 32, // Keep walking beyond the mask before starting the reset delay.
  // Guide targets respond immediately and clamp from the current face X to
  // the centre of the doorway. Door proximity is a separate, forgiving threshold.
  SNAP_RADIUS: 100,
  HITBOX_PADDING: 24,
  ENTRANCE_DELAY: 400,
  COMPLETION_DELAY: 500,
  HAPPY_DURATION: 650,
  DOOR_OPEN_DELAY: 450,
  LEVEL_TRANSITION_DELAY: 500,
  LEVEL_TRANSITION_DURATION: 360,
  SNAP_DURATION: 230,
  RETURN_DURATION: 330,
  PIECE_SIZE: 126,
  SOCKET_SIZE: 150,
  SOCKET_COLOUR_HINT_OPACITY: .38,
  AUDIO: {
    MUSIC_VOLUME: .30,
    SFX_VOLUME: .70,
    SFX_MULTIPLIERS: { pickup: .75, correct: 1, return: .65, complete: .90, door: .75 },
    MAX_SFX_VOICES: 6,
    HOLD_TO_RESET_MS: 700,
    MUTE_STORAGE_KEY: 'caterpillar-garden-muted',
  },
  PORTAL: { x: 1102, y: 423, width: 156, height: 240, occlusionX: 1190 },
};
