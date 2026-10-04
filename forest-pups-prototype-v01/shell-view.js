// Placeholder presentation adapters. Add variants here without touching puzzle input.
const holdingViews = {
  path(ctx, layout, w, h, open) {
    const bottom = layout.wolfZone.w === 1;
    ctx.save();
    ctx.strokeStyle = "#d9d3bd";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    const gap = open ? 0.17 : 0.015;
    ctx.beginPath();
    if (bottom) {
      const y = h * layout.wolfZone.y + 7;
      ctx.moveTo(w * 0.07, y);
      ctx.lineTo(w * (0.5 - gap), y);
      ctx.moveTo(w * (0.5 + gap), y);
      ctx.lineTo(w * 0.93, y);
    } else {
      const x = w * layout.wolfZone.w - 12;
      ctx.moveTo(x, h * 0.1);
      ctx.lineTo(x, h * (0.6 - gap));
      ctx.moveTo(x, h * (0.6 + gap));
      ctx.lineTo(x, h * 0.9);
    }
    ctx.stroke();
    ctx.restore();
  },
  none() {},
};
const exitViews = {
  genericDoor(ctx, p, t) {
    const r = p.radius;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = "#d5c9aa";
    ctx.strokeStyle = "#ae9f7f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.68, r);
    ctx.lineTo(-r * 0.68, -r * 0.2);
    ctx.bezierCurveTo(
      -r * 0.68,
      -r * 1.15,
      r * 0.68,
      -r * 1.15,
      r * 0.68,
      -r * 0.2,
    );
    ctx.lineTo(r * 0.68, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f7f4df";
    ctx.beginPath();
    ctx.ellipse(0, r * 0.05, r * 0.49, r * 0.73, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#b8bf9b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, r * 1.03, r * 0.86, r * 0.13, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  },
  pathExit(ctx, p) {
    ctx.save();
    ctx.strokeStyle = "#b7b997";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.x - p.radius * 0.5, p.y + p.radius * 0.5);
    ctx.quadraticCurveTo(
      p.x,
      p.y - p.radius * 0.5,
      p.x + p.radius * 0.5,
      p.y - p.radius * 0.5,
    );
    ctx.stroke();
    ctx.restore();
  },
};
export function drawHolding(ctx, shell, layout, w, h) {
  (holdingViews[shell.holding.variant] || holdingViews.path)(
    ctx,
    layout,
    w,
    h,
    shell.barrierOpen,
  );
}
export function drawExit(ctx, shell, destination, t) {
  if (!shell.exit.active && shell.exit.visibilityDuringPuzzle === "hidden")
    return;
  ctx.save();
  ctx.globalAlpha = shell.exit.active ? 1 : 0.25;
  (exitViews[destination.type] || exitViews.genericDoor)(ctx, destination, t);
  ctx.restore();
}
