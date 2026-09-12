import {
  CONFIG as C,
  LEVEL_DEFINITIONS,
  distance,
  resolveTarget,
} from "./config.js";
import {
  SOLAR_SHEET,
  SOLAR_SPRITES,
  SOLAR_ART_PENDING,
} from "./solar-sprites.js";
const canvas = document.querySelector("#play"),
  ctx = canvas.getContext("2d", { alpha: false }),
  dialog = document.querySelector("#debug");
const $ = (id) => document.getElementById(id),
  now = () => performance.now(),
  clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const KEY =
  "forest-pups-prototype-01-telemetry-v1" +
  (new URLSearchParams(location.search).has("test") ? "-test" : "");
let events = [],
  storageOK = true,
  saveTimer = 0,
  session = crypto.randomUUID?.() || String(Date.now()),
  sessionStart = now();
try {
  events = JSON.parse(localStorage.getItem(KEY) || "[]");
  if (!Array.isArray(events)) events = [];
} catch {
  storageOK = false;
}
function flush() {
  clearTimeout(saveTimer);
  saveTimer = 0;
  try {
    localStorage.setItem(KEY, JSON.stringify(events));
    storageOK = true;
  } catch {
    storageOK = false;
  }
}
function log(type, data = {}) {
  events.push({
    type,
    prototype: "01.1",
    session,
    at: new Date().toISOString(),
    ms: Math.round(now() - sessionStart),
    level: state.level + 1,
    ...data,
  });
  if (events.length > C.MAX_EVENTS)
    events.splice(0, events.length - C.MAX_EVENTS);
  if (!saveTimer)
    saveTimer = setTimeout(() => {
      if (!drag) flush();
      else {
        saveTimer = 0;
      }
    }, 800);
}
let W = 1,
  H = 1,
  R = 1,
  dpr = 1,
  drag = null,
  firstTouch = false,
  activePointers = new Set(),
  lastActivity = now(),
  hintStage = 0,
  pausedAt = 0;
let state = {
  level: 0,
  phase: "loading",
  pieces: [],
  targets: [],
  wolf: { x: 0.15, y: 0.6 },
  reaction: "idle",
  reactionUntil: 0,
  levelStart: now(),
  firstDrag: false,
  firstMatch: false,
  portal: null,
  transition: null,
};
const assets = {};
function loadImage(name, url) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => {
      assets[name] = im;
      resolve();
    };
    im.onerror = reject;
    im.src = url;
  });
}
const palette = {
  circle: ["#91b0c2", "#547d94"],
  triangle: ["#dda980", "#b77e58"],
  square: ["#a6b88a", "#6e8758"],
  star: ["#e6c676", "#b49445"],
};
const shapeCache = new Map();
function shapePath(c, type, r) {
  c.beginPath();
  if (type === "circle") {
    c.arc(0, 0, r, 0, Math.PI * 2);
    return;
  }
  const pts =
    type === "triangle"
      ? [
          [0, -1],
          [0.94, 0.78],
          [-0.94, 0.78],
        ]
      : type === "square"
        ? [
            [-0.83, -0.83],
            [0.83, -0.83],
            [0.83, 0.83],
            [-0.83, 0.83],
          ]
        : Array.from({ length: 10 }, (_, i) => {
            const a = -Math.PI / 2 + (i * Math.PI) / 5,
              rr = i % 2 ? 0.47 : 1;
            return [Math.cos(a) * rr, Math.sin(a) * rr];
          });
  pts.forEach(([x, y], i) =>
    i ? c.lineTo(x * r, y * r) : c.moveTo(x * r, y * r),
  );
  c.closePath();
}
function makeShape(type, slot = false) {
  const key = type + slot;
  if (shapeCache.has(key)) return shapeCache.get(key);
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.translate(128, 123);
  shapePath(g, type, 102);
  g.fillStyle = slot ? "#eee9dc" : palette[type][0];
  g.fill();
  g.lineWidth = slot ? 3 : 2.2;
  g.strokeStyle = slot ? "#bcb9a8" : palette[type][1];
  g.stroke();
  g.save();
  g.clip();
  const grad = g.createLinearGradient(-80, -90, 90, 100);
  grad.addColorStop(0, slot ? "#a69d871c" : "#ffffff50");
  grad.addColorStop(1, slot ? "#fffdf800" : "#5e503528");
  g.fillStyle = grad;
  g.fillRect(-120, -120, 240, 240);
  let seed = 7;
  for (let i = 0; i < 650; i++) {
    seed = (seed * 16807) % 2147483647;
    const x = (seed % 220) - 110;
    seed = (seed * 16807) % 2147483647;
    const y = (seed % 220) - 110;
    g.strokeStyle = i % 2 ? "#ffffff25" : "#65574712";
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 3 + (i % 7), y - 2);
    g.stroke();
  }
  g.restore();
  shapeCache.set(key, c);
  return c;
}
function shape(type, x, y, r, slot = false, alpha = 1, scale = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  if (!slot) {
    ctx.shadowColor = "#5b573328";
    ctx.shadowBlur = drag?.piece?.type === type ? 14 : 6;
    ctx.shadowOffsetY = drag?.piece?.type === type ? 7 : 3;
  }
  ctx.drawImage(
    makeShape(type, slot),
    x - r * 1.255 * scale,
    y - r * 1.206 * scale,
    r * 2.51 * scale,
    r * 2.51 * scale,
  );
  ctx.restore();
}
function drawObject(p, x, y, alpha = 1, scale = 1) {
  if (p.definition.renderer === "shape")
    return shape(p.type, x, y, p.radius, false, alpha, scale);
  const sprite = SOLAR_SPRITES[p.definition.sprite],
    r = p.radius * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (assets.solarSystem && sprite.crop) {
    const [sx, sy, sw, sh] = sprite.crop,
      fit = (2 * r) / Math.max(sw, sh);
    ctx.globalCompositeOperation = "multiply";
    if (sprite.clip) {
      ctx.beginPath();
      sprite.clip.forEach(([px, py], i) => {
        const dx = x - (sw * fit) / 2 + px * fit;
        const dy = y - (sh * fit) / 2 + py * fit;
        if (i === 0) ctx.moveTo(dx, dy);
        else ctx.lineTo(dx, dy);
      });
      ctx.closePath();
      ctx.clip();
    }
    ctx.drawImage(
      assets.solarSystem,
      sx,
      sy,
      sw,
      sh,
      x - (sw * fit) / 2,
      y - (sh * fit) / 2,
      sw * fit,
      sh * fit,
    );
  } else {
    // Explicitly temporary development fallback, replaced by the supplied sheet.
    ctx.fillStyle = sprite.color;
    ctx.strokeStyle = "#81745b50";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r * (sprite.rings ? 0.72 : 1), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (sprite.rings) {
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.3, -0.25, 0, Math.PI * 2);
      ctx.strokeStyle = sprite.color;
      ctx.lineWidth = p.type === "uranus" ? 2 : 5;
      ctx.stroke();
    }
  }
  ctx.restore();
}
function objectFor(target) {
  return state.pieces.find((p) => p.target.id === target.id);
}
function hitRadius(p) {
  return (
    Math.max(
      p.radius * p.definition.touchMultiplier,
      R * p.definition.minimumTouchScale,
    ) +
    C.HIT_PADDING * Math.max(1, W / 1200)
  );
}
function acquireRadius(p) {
  return (
    R *
    (C.TARGET_ACQUIRE_RADIUS + C.TARGET_SNAP_TOLERANCE) *
    p.definition.acquireMultiplier
  );
}
function releaseRadius(p) {
  return R * C.TARGET_RELEASE_RADIUS * p.definition.releaseMultiplier;
}
function visiblePieceBounds(p, q) {
  return Math.abs(p.x - q.x) <= p.radius && Math.abs(p.y - q.y) <= p.radius;
}
function bottomCompanion() {
  return (
    LEVEL_DEFINITIONS[state.level]?.companionRegion === "bottom" &&
    state.phase !== "final"
  );
}
function logicalDragPoint(q, d = drag) {
  const p = d.piece;
  return {
    x: clamp(
      q.x + d.offset.x,
      bottomCompanion()
        ? p.radius + 8
        : W * C.WOLF_ZONE_RIGHT + hitRadius(p) + 6,
      W - p.radius - 8,
    ),
    y: clamp(
      q.y + d.offset.y - C.FINGER_LIFT,
      p.radius + 8,
      bottomCompanion() ? (H * 2) / 3 - hitRadius(p) - 6 : H - p.radius - 8,
    ),
  };
}
function lockMeasurements(d) {
  return {
    maximumDistanceAfterLock: d.maxAfterLock || 0,
    reacquisitions: d.reacquisitions || 0,
    targetHistory: structuredClone(d.targetHistory || {}),
  };
}
function recordLockDistance(d, q) {
  if (!d.lock) return;
  const value = distance(q, d.lock);
  d.maxAfterLock = Math.max(d.maxAfterLock || 0, value);
  const item = d.targetHistory[d.lock.id];
  item.maximumDistance = Math.max(item.maximumDistance, value);
}
const crops = {
  idle: [145, 68, 304, 387],
  curious: [547, 68, 389, 392],
  happy: [1000, 548, 408, 365],
};
function wolfDimensions() {
  if (bottomCompanion())
    return {
      w: Math.min(W * 0.19, (H * 0.2) / 1.28),
      h: Math.min(W * 0.19 * 1.28, H * 0.2),
    };
  return {
    w: Math.min(W * 0.19, H * 0.29),
    h: Math.min(W * 0.19, H * 0.29) * 1.28,
  };
}
function wolf(
  x,
  y,
  { alpha = 1, scale = 1, pose = state.reaction, tilt = 0, bounce = 0 } = {},
) {
  const { w, h } = wolfDimensions();
  const crop = crops[pose] || crops.idle;
  // Fit each supplied pose without stretching its proportions. Keep feet aligned.
  const drawWidth = Math.min(w, (h * crop[2]) / crop[3]);
  const drawHeight = (drawWidth * crop[3]) / crop[2];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y - bounce);
  ctx.rotate(tilt);
  ctx.scale(scale, scale);
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(
    assets.wolf,
    ...crop,
    -drawWidth / 2,
    h / 2 - drawHeight,
    drawWidth,
    drawHeight,
  );
  ctx.restore();
}
function react(pose, ms = 900) {
  state.reaction = pose;
  state.reactionUntil = now() + ms;
}
let audio = null,
  muted = false;
function unlockAudio() {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state !== "running") audio.resume().catch(() => {});
    if (navigator.audioSession) navigator.audioSession.type = "playback";
  } catch {}
}
function sound(kind) {
  if (!audio || muted) return;
  if (audio.state !== "running") {
    audio
      .resume()
      .then(() => {
        if (audio.state === "running") playSound(kind);
      })
      .catch(() => log("audio_resume_failed"));
    return;
  }
  playSound(kind);
}
function playSound(kind) {
  if (muted) return;
  const notes = {
    pickup: [392],
    match: [523, 659],
    return: [294],
    complete: [523, 659, 784],
    portal: [392, 523, 659],
    friend: [523, 659, 784, 659],
  }[kind] || [440];
  notes.forEach((freq, i) => {
    const o = audio.createOscillator(),
      g = audio.createGain(),
      t = audio.currentTime + i * 0.1;
    o.type = "sine";
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.94, t + 0.16);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(
      kind === "return" ? 0.025 : 0.055,
      t + 0.015,
    );
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    o.connect(g);
    g.connect(audio.destination);
    o.start(t);
    o.stop(t + 0.26);
  });
}
function position() {
  state.wolfMove = null;
  const level = LEVEL_DEFINITIONS[state.level];
  R = Math.min(W * level.radiusWidth, H * level.radiusHeight);
  for (const p of state.pieces) {
    p.radius = R * p.definition.visualScale;
    p.home = { x: p.layout[0] * W, y: p.layout[1] * H };
    p.target.x = p.layout[2] * W;
    p.target.y = p.layout[3] * H;
    p.x = p.done ? p.target.x : p.home.x;
    p.y = p.done ? p.target.y : p.home.y;
    p.tween = null;
  }
  if (state.portal) {
    const target = state.targets.find((t) => t.id === state.portal.id);
    if (target) Object.assign(state.portal, target);
  }
  if (bottomCompanion()) {
    state.wolf.x = clamp(state.wolf.x, 0.12, 0.88);
    state.wolf.y = 5 / 6;
  } else {
    state.wolf.x = clamp(state.wolf.x, 0.13, 0.17);
    state.wolf.y = clamp(state.wolf.y, 0.3, 0.72);
  }
}
function resize() {
  if (drag) cancelDrag("resize");
  const oldWidth = W,
    oldHeight = H;
  const b = canvas.getBoundingClientRect();
  W = b.width;
  H = b.height;
  dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  position();
  if (state.transition && state.portal) {
    state.transition.from.x *= W / oldWidth;
    state.transition.from.y *= H / oldHeight;
    state.transition.to = { x: state.portal.x, y: state.portal.y };
  }
  log("viewport_changed", { width: W, height: H, dpr });
}
function startLevel(index) {
  drag = null;
  state.level = index;
  state.phase = "puzzle";
  state.portal = null;
  state.transition = null;
  state.wolfMove = null;
  state.wolf = bottomCompanion() ? { x: 0.5, y: 5 / 6 } : { x: 0.15, y: 0.6 };
  state.reaction = "idle";
  state.levelStart = now();
  state.firstDrag = false;
  state.firstMatch = false;
  state.targets = [];
  state.definition = LEVEL_DEFINITIONS[index];
  state.pieces = state.definition.objects.map((definition) => {
    const target = {
      id: `L${index + 1}-${definition.destination.id}`,
      type: definition.id,
      x: 0,
      y: 0,
    };
    state.targets.push(target);
    return {
      id: target.id,
      type: definition.id,
      definition,
      layout: [...definition.home, ...definition.destination.position],
      target,
      x: 0,
      y: 0,
      radius: 0,
      done: false,
      attempts: 0,
      tween: null,
    };
  });
  position();
  lastActivity = now();
  hintStage = 0;
  log("level_start");
}
function point(e) {
  const b = canvas.getBoundingClientRect();
  return { x: e.clientX - b.left, y: e.clientY - b.top };
}
function hitPiece(p, q) {
  return !p.done && !p.tween && distance(p, q) <= hitRadius(p);
}
function wolfBounds(extended = false) {
  const d = wolfDimensions(),
    m = extended ? C.WOLF_TOUCH_MULTIPLIER : 1;
  const box = {
    left: state.wolf.x * W - (d.w * m) / 2,
    right: state.wolf.x * W + (d.w * m) / 2,
    top: state.wolf.y * H - (d.h * m) / 2,
    bottom: state.wolf.y * H + (d.h * m) / 2,
  };
  if (extended && state.phase === "puzzle") {
    if (bottomCompanion()) box.top = Math.max(box.top, (H * 2) / 3);
    else box.right = Math.min(box.right, W * C.WOLF_ZONE_RIGHT);
  }
  return box;
}
function inBox(q, b) {
  return q.x >= b.left && q.x <= b.right && q.y >= b.top && q.y <= b.bottom;
}
function wolfHit(q) {
  return inBox(q, wolfBounds(true));
}
function activity() {
  lastActivity = now();
  hintStage = 0;
}
function capture(e) {
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {
    log("capture_unavailable");
  }
}
function down(e) {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  e.preventDefault();
  activePointers.add(e.pointerId);
  unlockAudio();
  if (!firstTouch) {
    firstTouch = true;
    log("first_touch", { x: point(e).x, y: point(e).y });
  }
  if (
    drag ||
    dialog.open ||
    state.phase === "loading" ||
    state.phase === "travel" ||
    state.phase === "fade" ||
    state.phase === "celebrate"
  ) {
    if (drag) log("additional_touch_ignored", { pointer: e.pointerId });
    return;
  }
  const q = point(e);
  activity();
  if (state.phase === "final") {
    const character = wolfHit(q)
      ? "wolf"
      : distance(q, { x: W * 0.64, y: H * 0.55 }) < H * 0.2
        ? "fox"
        : null;
    if (character) {
      state.characterReactions ||= {};
      state.characterReactions[character] = now();
      sound("friend");
      log("friend_touched", { character });
    }
    return;
  }
  if (state.phase === "puzzle") {
    const p = state.pieces
      .filter((p) => hitPiece(p, q))
      .sort(
        (a, b) =>
          Number(visiblePieceBounds(b, q)) - Number(visiblePieceBounds(a, q)) ||
          distance(a, q) - distance(b, q),
      )[0];
    if (p) {
      p.attempts++;
      log("piece_touched", {
        shape: p.type,
        x: q.x,
        y: q.y,
        attempt: p.attempts,
        hitRegion: visiblePieceBounds(p, q)
          ? "visible_bounds"
          : "extended_bounds",
      });
      drag = {
        kind: "piece",
        id: e.pointerId,
        piece: p,
        start: now(),
        last: q,
        point: q,
        offset: { x: p.x - q.x, y: p.y - q.y },
        distance: 0,
        path: [[Math.round(q.x), Math.round(q.y), 0]],
        sample: now(),
        lock: null,
        everLocked: false,
        maxAfterLock: 0,
        reacquisitions: 0,
        targetHistory: {},
        afterAcquire: 0,
        moved: false,
      };
      log("piece_acquired", {
        shape: p.type,
        hitRegion: visiblePieceBounds(p, q)
          ? "visible_bounds"
          : "extended_bounds",
      });
      react("curious", 1400);
      sound("pickup");
      capture(e);
      return;
    }
  }
  if (wolfHit(q)) {
    const hitRegion = inBox(q, wolfBounds())
      ? "visible_bounds"
      : "extended_bounds";
    log("wolf_touched", { hitRegion });
    if (hitRegion === "extended_bounds") log("wolf_pickup_extended_bounds");
    drag = {
      kind: "wolf",
      id: e.pointerId,
      start: now(),
      last: q,
      point: q,
      ghost: q,
      lock: null,
      everLocked: false,
      maxAfterLock: 0,
      reacquisitions: 0,
      targetHistory: {},
      afterAcquire: 0,
      distance: 0,
      path: [],
      sample: now(),
      moved: false,
    };
    log("wolf_ghost_drag_started", { hitRegion });
    capture(e);
    sound("pickup");
    updateWolf(q);
  }
}
function updateLock(q, candidates, acq, rel) {
  recordLockDistance(drag, q);
  const old = drag.lock,
    next = resolveTarget(q, candidates, old, acq, rel);
  if (next?.id !== old?.id) {
    if (next) {
      const history = (drag.targetHistory[next.id] ||= {
        acquisitions: 0,
        reacquisitions: 0,
        maximumDistance: 0,
      });
      if (history.acquisitions) {
        history.reacquisitions++;
        drag.reacquisitions++;
        log("target_reacquired", {
          target: next.id,
          count: history.reacquisitions,
        });
      }
      history.acquisitions++;
      log(old ? "target_switched" : "target_acquired", {
        shape: drag.piece?.type || "wolf",
        target: next.id,
        from: old?.id,
        distanceAfterPreviousAcquisition: drag.afterAcquire,
        x: q.x,
        y: q.y,
      });
      drag.everLocked = true;
      drag.lockAt = now();
      drag.afterAcquire = 0;
    } else if (old)
      log("target_cancelled", {
        target: old.id,
        distanceFromTarget: distance(q, old),
        distanceAfterAcquisition: drag.afterAcquire,
        ...lockMeasurements(drag),
      });
    drag.lock = next;
    recordLockDistance(drag, q);
  }
}
function updateWolf(q) {
  if (state.phase === "portal") {
    drag.ghost = q;
    updateLock(
      q,
      [state.portal],
      R * C.WOLF_ACQUIRE_RADIUS,
      R * C.WOLF_RELEASE_RADIUS,
    );
  } else {
    const d = wolfDimensions();
    if (bottomCompanion()) {
      drag.ghost = {
        x: clamp(q.x, d.w * 0.7 + 6, W - d.w * 0.7 - 6),
        y: clamp(q.y, (H * 2) / 3 + d.h * 0.7 + 6, H - d.h * 0.7 - 6),
      };
      drag.valid =
        q.y > (H * 2) / 3 && q.y < H - 12 && q.x > 12 && q.x < W - 12;
      return;
    }
    drag.ghost = {
      x: clamp(
        q.x,
        (d.w * C.WOLF_TOUCH_MULTIPLIER) / 2 + 6,
        W * C.WOLF_ZONE_RIGHT - (d.w * C.WOLF_TOUCH_MULTIPLIER) / 2 - 6,
      ),
      y: clamp(q.y, d.h / 2 + 25, H - d.h / 2 - 25),
    };
    drag.valid =
      q.x < W * C.WOLF_ZONE_RIGHT && q.x > 12 && q.y > 12 && q.y < H - 12;
  }
}
function moveOne(e) {
  if (!drag || drag.id !== e.pointerId) return;
  const q = point(e),
    dd = distance(q, drag.last);
  drag.distance += dd;
  if (drag.lock) drag.afterAcquire += dd;
  drag.last = q;
  drag.point = q;
  if (!drag.moved && drag.distance > 3) {
    drag.moved = true;
    log("drag_started", { kind: drag.kind, shape: drag.piece?.type });
    if (drag.kind === "piece" && !state.firstDrag) {
      state.firstDrag = true;
      log("time_to_first_drag", { duration: now() - state.levelStart });
    }
  }
  if (now() - drag.sample >= C.PATH_SAMPLE_MS) {
    if (drag.path.length < 500)
      drag.path.push([
        Math.round(q.x),
        Math.round(q.y),
        Math.round(now() - drag.start),
      ]);
    drag.sample = now();
  }
  if (drag.kind === "piece") {
    const p = drag.piece;
    Object.assign(p, logicalDragPoint(q));
    updateLock(
      p,
      state.targets.filter(
        (t) =>
          t.type === p.type && !state.pieces.find((s) => s.target === t)?.done,
      ),
      acquireRadius(p),
      releaseRadius(p),
    );
  } else updateWolf(q);
}
function move(e) {
  if (!drag || drag.id !== e.pointerId) return;
  e.preventDefault();
  activity();
  const co = e.getCoalescedEvents?.();
  if (co?.length) co.forEach(moveOne);
  else moveOne(e);
}
function tween(p, x, y, duration) {
  p.tween = { x: p.x, y: p.y, toX: x, toY: y, start: now(), duration };
}
function releaseCapture(id) {
  try {
    if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  } catch {}
}
function up(e) {
  activePointers.delete(e.pointerId);
  if (!drag || drag.id !== e.pointerId) return;
  e.preventDefault();
  const d = drag,
    q = point(e);
  recordLockDistance(d, d.kind === "piece" ? logicalDragPoint(q, d) : q);
  log("release_location", {
    kind: d.kind,
    shape: d.piece?.type,
    x: q.x,
    y: q.y,
    locked: !!d.lock,
    captured: canvas.hasPointerCapture(d.id),
  });
  log("drag_end", {
    kind: d.kind,
    shape: d.piece?.type,
    duration: now() - d.start,
    distance: d.distance,
    path: d.path,
    distanceAfterAcquisition: d.afterAcquire,
    ...lockMeasurements(d),
  });
  if (d.lock)
    log("pointer_up_while_target_locked", {
      target: d.lock.id,
      distanceAfterAcquisition: d.afterAcquire,
      ...lockMeasurements(d),
    });
  else if (d.everLocked)
    log("pointer_up_after_target_lost", {
      kind: d.kind,
      ...lockMeasurements(d),
    });
  drag = null;
  releaseCapture(e.pointerId);
  if (d.kind === "piece") {
    const p = d.piece;
    if (d.lock) {
      p.done = true;
      tween(p, d.lock.x, d.lock.y, C.TARGET_SNAP_DURATION);
      log("correct_match", { shape: p.type, attempts: p.attempts });
      log("successful_snap", { shape: p.type, target: d.lock.id });
      if (!state.firstMatch) {
        state.firstMatch = true;
        log("time_to_first_successful_match", {
          duration: now() - state.levelStart,
        });
      }
      react("happy");
      sound("match");
      if (state.pieces.every((p) => p.done)) {
        state.phase = "celebrate";
        state.completeAt = now();
        react("happy", 1500);
        sound("complete");
        log("puzzle_completion", {
          duration: now() - state.levelStart,
          attempts: Object.fromEntries(
            state.pieces.map((p) => [p.type, p.attempts]),
          ),
        });
      }
    } else {
      const wrong = state.targets.find(
        (t) => t.type !== p.type && distance(p, t) < acquireRadius(p),
      );
      log(wrong ? "incorrect_target_attempt" : "empty_space_release", {
        shape: p.type,
        target: wrong?.id,
      });
      tween(p, p.home.x, p.home.y, C.RETURN_DURATION);
      react("curious", 900);
      sound("return");
    }
  } else {
    log("wolf_ghost_release", {
      x: q.x,
      y: q.y,
      valid: state.phase === "portal" ? !!d.lock : d.valid,
    });
    if (state.phase === "portal" && d.lock) {
      log("portal_interaction");
      state.phase = "travel";
      state.transition = {
        start: now(),
        from: { x: state.wolf.x * W, y: state.wolf.y * H },
        to: { x: state.portal.x, y: state.portal.y },
      };
      sound("portal");
    } else if (state.phase === "puzzle" && d.valid) {
      state.wolfMove = {
        from: { ...state.wolf },
        to: { x: d.ghost.x / W, y: d.ghost.y / H },
        start: now(),
      };
    } else sound("return");
  }
  activity();
  flush();
}
function cancelDrag(reason) {
  if (!drag) return;
  const d = drag;
  drag = null;
  releaseCapture(d.id);
  log("pointer_cancel", {
    reason,
    kind: d.kind,
    shape: d.piece?.type,
    duration: now() - d.start,
    distance: d.distance,
    path: d.path,
    lockedTarget: d.lock?.id,
    ...lockMeasurements(d),
  });
  if (d.kind === "piece")
    tween(d.piece, d.piece.home.x, d.piece.home.y, C.RETURN_DURATION);
  activity();
  flush();
}
canvas.addEventListener("pointerdown", down);
canvas.addEventListener("pointermove", move);
canvas.addEventListener("pointerup", up);
canvas.addEventListener("pointercancel", (e) => {
  activePointers.delete(e.pointerId);
  if (drag?.id === e.pointerId) cancelDrag("pointercancel");
});
canvas.addEventListener("lostpointercapture", (e) => {
  if (drag?.id === e.pointerId) cancelDrag("lostpointercapture");
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("dragstart", (e) => e.preventDefault());
window.addEventListener("blur", () => {
  cancelDrag("blur");
  activePointers.clear();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelDrag("hidden");
    activePointers.clear();
    flush();
  }
});
window.addEventListener("pagehide", flush);
window.addEventListener("resize", resize);
function ring(x, y, r, color, dash = []) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
function drawPortal(t) {
  const p = state.portal;
  const object = objectFor(p);
  drawObject(object, p.x, p.y, 0.8);
  ctx.save();
  ctx.translate(p.x, p.y);
  shapePath(ctx, object.definition.shape || "circle", R * 0.9);
  const g = ctx.createRadialGradient(0, 0, 3, 0, 0, R);
  g.addColorStop(0, "#fffdf8");
  g.addColorStop(0.7, "#eef4d9");
  g.addColorStop(1, "#92af75");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "#a1b984";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
  ring(p.x, p.y, R * (1.16 + 0.025 * Math.sin(t / 650)), "#b0c88c70");
  if (drag?.kind === "wolf" && drag.lock)
    wolf(p.x, p.y, { alpha: 0.28, scale: 0.65, pose: "happy" });
}
function draw(t) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, W, H);
  if (!assets.wolf) {
    requestAnimationFrame(draw);
    return;
  }
  if (dialog.open) {
    t = pausedAt;
  }
  if (state.reactionUntil < t && ["puzzle", "portal"].includes(state.phase))
    state.reaction = "idle";
  if (state.wolfMove) {
    const m = state.wolfMove,
      k = clamp((t - m.start) / 450, 0, 1),
      e = 1 - (1 - k) ** 3;
    state.wolf.x = m.from.x + (m.to.x - m.from.x) * e;
    state.wolf.y = m.from.y + (m.to.y - m.from.y) * e;
    if (k === 1) state.wolfMove = null;
  }
  if (state.phase === "celebrate" && t - state.completeAt > 1100) {
    state.phase = "portal";
    state.portal = {
      ...state.targets.find((t) => t.type === state.definition.portalObject),
    };
    lastActivity = t;
    hintStage = 0;
    log("portal_ready");
  }
  if (state.phase === "final") {
    const bounceStart = state.characterReactions?.wolf || state.finalAt;
    const b =
      t - bounceStart < 900
        ? Math.sin(clamp((t - bounceStart) / 900, 0, 1) * Math.PI) * 16
        : 0;
    wolf(W * 0.38, H * 0.55, { pose: "idle", bounce: b, tilt: b * 0.005 });
    ctx.save();
    ctx.globalAlpha = clamp((t - state.finalAt) / 700, 0, 1);
    const s = Math.min(H * 0.4, W * 0.26);
    const foxStart = state.characterReactions?.fox || state.finalAt;
    const foxBounce =
      t - foxStart < 900
        ? Math.sin(Math.min(1, (t - foxStart) / 900) * Math.PI) * 18
        : 0;
    ctx.translate(W * 0.64, H * 0.55 - foxBounce);
    ctx.rotate(-foxBounce * 0.005);
    ctx.drawImage(assets.fox, -s / 2, -s / 2, s, s);
    ctx.restore();
    state.wolf = { x: 0.38, y: 0.55 };
  } else {
    if (state.definition?.path) {
      ctx.save();
      ctx.strokeStyle = "#b8b5a34a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(state.targets[0].x, state.targets[0].y);
      ctx.lineTo(state.targets.at(-1).x, state.targets.at(-1).y);
      ctx.stroke();
      ctx.restore();
    }
    for (const target of state.targets) {
      if (state.definition.socketStyle === "neutral")
        ring(target.x, target.y, R * 0.72, "#b6b5a180");
      else shape(target.type, target.x, target.y, R, true);
    }
    if (
      drag?.lock &&
      drag.kind === "piece" &&
      t - drag.lockAt >= C.GHOST_PREVIEW_ACTIVATION_THRESHOLD
    ) {
      drawObject(drag.piece, drag.lock.x, drag.lock.y, 0.38);
      ring(drag.lock.x, drag.lock.y, R * 1.18, "#8eab6980");
    }
    for (const p of state.pieces) {
      if (p.tween) {
        const m = p.tween,
          k = clamp((t - m.start) / m.duration, 0, 1),
          e = 1 - (1 - k) ** 3;
        p.x = m.x + (m.toX - m.x) * e;
        p.y = m.y + (m.toY - m.y) * e;
        if (k === 1) p.tween = null;
      }
      if (
        state.portal?.id === p.id &&
        ["portal", "travel", "fade"].includes(state.phase)
      )
        continue;
      let x = p.x,
        y = p.y,
        scale = 1;
      if (drag?.piece === p) {
        scale = C.PICKUP_SCALE;
        if (drag.lock) {
          x += (drag.lock.x - x) * C.TARGET_MAGNET_STRENGTH;
          y += (drag.lock.y - y) * C.TARGET_MAGNET_STRENGTH;
        }
      } else if (
        hintStage >= 2 &&
        !p.done &&
        p === state.pieces.find((p) => !p.done)
      ) {
        const elapsed = t - lastActivity - C.HINT_PIECE_MS;
        if (elapsed % 11000 < 650)
          y -= Math.sin(((elapsed % 11000) / 650) * Math.PI) * 5;
      }
      if (state.definition.path && state.phase === "celebrate")
        scale *= 1 + 0.035 * Math.sin((t - state.completeAt) / 160);
      drawObject(p, x, y, 1, scale);
    }
    if (state.portal) drawPortal(t);
    let wx = state.wolf.x * W,
      wy = state.wolf.y * H,
      scale = 1,
      alpha = 1,
      pose = state.reaction,
      tilt = pose === "curious" ? 0.055 : 0,
      bounce = 0;
    if (state.phase === "celebrate")
      bounce = Math.abs(Math.sin((t - state.completeAt) / 150)) * 12;
    if (state.phase === "travel" || state.phase === "fade") {
      const m = state.transition,
        k = clamp((t - m.start) / 1300, 0, 1),
        e = k * k * (3 - 2 * k);
      wx = m.from.x + (m.to.x - m.from.x) * e;
      wy = m.from.y + (m.to.y - m.from.y) * e;
      pose = "happy";
      scale = 1 - 0.8 * Math.max(0, (k - 0.6) / 0.4);
      alpha = 1 - Math.max(0, (k - 0.75) / 0.25);
      if (k === 1 && state.phase === "travel") {
        state.phase = "fade";
        state.fadeAt = t;
        log("level_transition");
      }
    }
    wolf(wx, wy, { pose, tilt, bounce, scale, alpha });
    if (drag?.kind === "wolf") {
      if (state.phase === "puzzle") {
        const g = drag.ghost;
        ctx.save();
        ctx.fillStyle = drag.valid ? "#e5ecd870" : "#eee9dd60";
        ctx.beginPath();
        ctx.ellipse(
          g.x,
          g.y + wolfDimensions().h * 0.42,
          35,
          9,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.restore();
      }
      wolf(drag.ghost.x, drag.ghost.y, {
        alpha: 0.35,
        scale: 1.03,
        pose: "idle",
      });
    }
    if (state.phase === "fade") {
      const a = clamp((t - state.fadeAt) / 650, 0, 1);
      ctx.fillStyle = `rgba(255,253,248,${a})`;
      ctx.fillRect(0, 0, W, H);
      if (a === 1) {
        if (state.level === LEVEL_DEFINITIONS.length - 1) {
          state.phase = "final";
          state.finalAt = t;
          state.characterReactions = {};
          state.portal = null;
          state.wolf = { x: 0.38, y: 0.55 };
          log("final_completion");
          sound("friend");
        } else startLevel(state.level + 1);
        state.fadeInAt = t;
      }
    }
  }
  if (state.fadeInAt) {
    const a = 1 - clamp((t - state.fadeInAt) / 600, 0, 1);
    if (a > 0) {
      ctx.fillStyle = `rgba(255,253,248,${a})`;
      ctx.fillRect(0, 0, W, H);
    } else state.fadeInAt = 0;
  }
  if (!drag && !dialog.open && ["puzzle", "portal"].includes(state.phase)) {
    const idle = t - lastActivity;
    if (idle > C.HINT_LOOK_MS && hintStage < 1) {
      hintStage = 1;
      react("curious", 1400);
      log("hint_wolf_attention");
    }
    if (idle > C.HINT_PIECE_MS && hintStage < 2) {
      hintStage = 2;
      log(state.phase === "portal" ? "hint_portal" : "hint_piece");
    }
    if (state.phase === "portal" && hintStage >= 2) {
      const p = state.portal;
      if (idle % 12000 < 1800) {
        for (let i = 1; i <= 3; i++) {
          const a = i / 4;
          ctx.fillStyle = "#b4c69650";
          ctx.beginPath();
          ctx.arc(
            state.wolf.x * W + (p.x - state.wolf.x * W) * a,
            state.wolf.y * H + (p.y - state.wolf.y * H) * a,
            3,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
    }
  }
  if ($("hitboxes").checked) {
    state.pieces
      .filter((p) => !p.done)
      .forEach((p) => ring(p.x, p.y, hitRadius(p), "#4789bf", [4, 4]));
    const box = wolfBounds(true);
    ctx.strokeStyle = "#9875a0";
    ctx.strokeRect(
      box.left,
      box.top,
      box.right - box.left,
      box.bottom - box.top,
    );
    ctx.strokeStyle = "#9875a050";
    if (bottomCompanion()) ctx.strokeRect(0, (H * 2) / 3, W, H / 3);
    else ctx.strokeRect(0, 0, W * C.WOLF_ZONE_RIGHT, H);
  }
  for (const target of state.targets) {
    if ($("acquire").checked)
      ring(
        target.x,
        target.y,
        acquireRadius(objectFor(target)),
        "#559b7b70",
        [5, 5],
      );
    if ($("release").checked)
      ring(
        target.x,
        target.y,
        releaseRadius(objectFor(target)),
        "#c1a15380",
        [8, 6],
      );
  }
  if ($("locked").checked && drag?.lock)
    ring(drag.lock.x, drag.lock.y, R * 1.3, "#617ad5");
  requestAnimationFrame(draw);
}
function snapshot() {
  return {
    prototype: "Forest Pups 01.1",
    artStatus: SOLAR_ART_PENDING ? "solar-sheet-pending" : "complete",
    levelDefinitions: LEVEL_DEFINITIONS,
    exportedAt: new Date().toISOString(),
    configuration: C,
    viewport: { width: W, height: H, dpr },
    storagePersistent: storageOK,
    events,
  };
}
function updateDebug() {
  const current = events.filter((e) => e.session === session),
    counts = current.reduce(
      (a, e) => ((a[e.type] = (a[e.type] || 0) + 1), a),
      {},
    );
  $("status").textContent =
    `Prototype 01.1${SOLAR_ART_PENDING ? " · Solar System development art (sheet pending)" : ""} · Level ${state.level + 1} · ${state.phase} · ${events.length} saved events · ${storageOK ? "local storage available" : "storage unavailable — export before closing"} · ${navigator.serviceWorker?.controller ? "offline cache active" : "offline cache not yet controlling this page"}`;
  $("metrics").textContent = JSON.stringify(
    {
      matches: counts.correct_match || 0,
      incorrectTargets: counts.incorrect_target_attempt || 0,
      emptyReleases: counts.empty_space_release || 0,
      locks: counts.target_acquired || 0,
      lostLocks: counts.target_cancelled || 0,
      reacquisitions: counts.target_reacquired || 0,
      extendedWolfPickups: counts.wolf_pickup_extended_bounds || 0,
      extendedPiecePickups: current.filter(
        (e) => e.type === "piece_acquired" && e.hitRegion === "extended_bounds",
      ).length,
      retainedReleases: counts.pointer_up_while_target_locked || 0,
      cancellations: counts.pointer_cancel || 0,
      timings: current
        .filter((e) => /time_to_first|puzzle_completion/.test(e.type))
        .map((e) => ({
          level: e.level,
          type: e.type,
          ms: Math.round(e.duration),
          attempts: e.attempts,
        })),
    },
    null,
    2,
  );
  $("raw").value = JSON.stringify(snapshot(), null, 2);
}
function openDebug() {
  cancelDrag("parent_tools");
  pausedAt = now();
  dialog.showModal();
  log("parent_tools_opened");
  flush();
  updateDebug();
}
let hold = null,
  holdStart = null;
const hotspot = $("parent");
hotspot.addEventListener("pointerdown", (e) => {
  if (drag || activePointers.size) return;
  e.preventDefault();
  holdStart = { id: e.pointerId, x: e.clientX, y: e.clientY };
  try {
    hotspot.setPointerCapture(e.pointerId);
  } catch {}
  hold = setTimeout(openDebug, C.PARENT_HOLD_MS);
});
const clearHold = () => {
  clearTimeout(hold);
  hold = null;
  holdStart = null;
};
hotspot.addEventListener("pointermove", (e) => {
  if (
    holdStart &&
    Math.hypot(e.clientX - holdStart.x, e.clientY - holdStart.y) > 10
  )
    clearHold();
});
["pointerup", "pointercancel", "lostpointercapture"].forEach((t) =>
  hotspot.addEventListener(t, clearHold),
);
function resume() {
  const delta = now() - pausedAt;
  state.levelStart += delta;
  state.completeAt += delta;
  state.finalAt += delta;
  for (const id of Object.keys(state.characterReactions || {}))
    state.characterReactions[id] += delta;
  state.fadeAt += delta;
  if (state.transition) state.transition.start += delta;
  if (state.wolfMove) state.wolfMove.start += delta;
  for (const p of state.pieces) if (p.tween) p.tween.start += delta;
  state.reactionUntil += delta;
  if (state.fadeInAt) state.fadeInAt += delta;
  activity();
}
$("close").onclick = () => dialog.close();
dialog.addEventListener("close", resume);
$("restart").onclick = () => {
  log("restart");
  startLevel(0);
  pausedAt = now();
  updateDebug();
};
$("reset").onclick = () => {
  events = [];
  session = crypto.randomUUID?.() || String(Date.now());
  sessionStart = now();
  firstTouch = false;
  log("session_start", { reason: "telemetry_reset" });
  startLevel(0);
  pausedAt = now();
  flush();
  updateDebug();
};
$("export").onclick = () => {
  flush();
  const url = URL.createObjectURL(
      new Blob([JSON.stringify(snapshot(), null, 2)], {
        type: "application/json",
      }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = `forest-pups-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};
$("copy").onclick = async () => {
  updateDebug();
  try {
    await navigator.clipboard.writeText($("raw").value);
    $("status").textContent = "JSON copied.";
  } catch {
    $("raw").closest("details").open = true;
    $("raw").focus();
    $("raw").select();
    $("status").textContent = "Select and copy the JSON below.";
  }
};
$("test-sound").onclick = () => {
  muted = false;
  $("mute").checked = false;
  unlockAudio();
  sound("friend");
};
document.addEventListener("pointerdown", unlockAudio, {
  capture: true,
  passive: true,
});
$("mute").onchange = (e) => {
  muted = e.target.checked;
};
log("session_start", { userAgent: navigator.userAgent });
resize();
requestAnimationFrame(draw);
Promise.all([
  loadImage("wolf", "assets/wolf-poses.png"),
  loadImage("fox", "assets/fox.png"),
  ...(SOLAR_SHEET ? [loadImage("solarSystem", SOLAR_SHEET)] : []),
])
  .then(() => startLevel(0))
  .catch(() => {
    document.querySelector("#game").textContent =
      "An illustration could not load. Reload this page while online.";
  });
if ("serviceWorker" in navigator && location.protocol !== "file:")
  navigator.serviceWorker
    .register("./sw.js")
    .catch(() => log("offline_cache_unavailable"));
// Read-only inspection for automated regression tests and adult diagnostics.
window.ForestPups = {
  snapshot: () =>
    structuredClone({
      state,
      drag,
      config: C,
      events,
      W,
      H,
      R,
      hitRadii: state.pieces.map((p) => hitRadius(p)),
      wolfBounds: wolfBounds(true),
      audioState: audio?.state || "not-started",
      muted,
    }),
  openDebug,
};
