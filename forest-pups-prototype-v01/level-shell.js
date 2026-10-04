// Shared shell: no puzzle, DOM, input, timers or asset dependencies.
export const LAYOUT_PROFILES = Object.freeze({
  leftCompanion: {
    wolfZone: { x: 0, y: 0, w: 0.29, h: 1 },
    puzzleArea: { x: 0.29, y: 0, w: 0.71, h: 1 },
    wolfHome: { x: 0.15, y: 0.6 },
    exitArea: { x: 0.035, y: 0.075, w: 0.23, h: 0.27 },
    exitAnchor: { x: 0.15, y: 0.21 },
  },
  bottomCompanion: {
    wolfZone: { x: 0, y: 2 / 3, w: 1, h: 1 / 3 },
    puzzleArea: { x: 0, y: 0, w: 1, h: 2 / 3 },
    wolfHome: { x: 0.5, y: 5 / 6 },
    exitArea: { x: 0.72, y: 0.7, w: 0.25, h: 0.29 },
    exitAnchor: { x: 0.84, y: 5 / 6 },
  },
});
export function layoutFor(definition) {
  return (
    LAYOUT_PROFILES[definition.layoutProfile] || LAYOUT_PROFILES.leftCompanion
  );
}
export function createEvents() {
  const listeners = new Map();
  return {
    on(name, fn) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(fn);
      return () => listeners.get(name).delete(fn);
    },
    emit(name, payload) {
      for (const fn of listeners.get(name) || []) fn(payload);
    },
  };
}
export function createLevelShell(events) {
  let value = null;
  const emit = (name, extra = {}) =>
    events.emit(name, { levelId: value.levelId, ...extra });
  return {
    get state() {
      return value;
    },
    start(definition, options = {}) {
      const mode = options.endingMode || definition.endingMode || "interactive";
      value = {
        levelId: definition.id,
        phase: "puzzleActive",
        endingMode: mode,
        layoutProfile: definition.layoutProfile,
        progress: {
          placed: 0,
          total: new Set(definition.objects.map((o) => o.destination.id)).size,
        },
        barrierOpen: false,
        exit: {
          id: `exit:${definition.id}`,
          type: definition.exitType || "genericDoor",
          active: false,
          visibilityDuringPuzzle:
            definition.exit?.visibilityDuringPuzzle || "hidden",
          position:
            definition.exit?.position || layoutFor(definition).exitAnchor,
        },
        holding: definition.holding || { variant: "path" },
        completed: false,
      };
    },
    progress(placed, total) {
      if (value.phase !== "puzzleActive") return;
      value.progress = { placed, total };
      emit("puzzleProgress", value.progress);
      if (placed === total) {
        value.phase = "puzzleComplete";
        emit("puzzleCompleted");
      }
    },
    activateExit() {
      if (value.phase !== "puzzleComplete" || value.exit.active) return;
      value.exit.active = true;
      value.barrierOpen = true;
      emit("exitActivated", { exitId: value.exit.id });
      if (value.endingMode === "interactive") {
        value.phase = "wolfLocomotionUnlocked";
        emit("wolfLocomotionUnlocked");
      } else this.beginEnding();
    },
    beginEnding() {
      if (
        !value.exit.active ||
        !["puzzleComplete", "wolfLocomotionUnlocked"].includes(value.phase)
      )
        return;
      value.phase = "levelEnding";
      emit("endingStarted", { mode: value.endingMode });
    },
    finish() {
      if (value.phase !== "levelEnding" || value.completed) return;
      value.completed = true;
      emit("levelCompleted");
    },
    destination(width, height) {
      const p = value.exit.position;
      return {
        id: value.exit.id,
        x: p.x * width,
        y: p.y * height,
        radius: Math.min(width * 0.065, height * 0.085),
        type: value.exit.type,
      };
    },
  };
}
