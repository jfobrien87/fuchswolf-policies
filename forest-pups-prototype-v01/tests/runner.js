import { resolveTarget, matchesObject } from "../config.js";
const result = document.querySelector("#result"),
  sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function assert(v, m) {
  if (!v) throw Error(m);
}
async function until(f, message) {
  const start = performance.now();
  while (!f()) {
    if (performance.now() - start > 6000) throw Error("Timed out: " + message);
    await sleep(50);
  }
}
document.querySelector("#run").onclick = async () => {
  document.querySelector("#run").disabled = true;
  const results = [];
  try {
    assert(
      matchesObject(
        { shape: "circle", colour: "red" },
        { shape: "circle", colour: "blue" },
        "shape",
      ),
      "shape mode ignores colour",
    );
    assert(
      !matchesObject(
        { shape: "circle", colour: "red" },
        { shape: "circle", colour: "blue" },
        "shapeAndColour",
      ),
      "colour rule rejects wrong colour",
    );
    const a = { id: "a", x: 100, y: 100 },
      b = { id: "b", x: 300, y: 100 };
    assert(
      resolveTarget({ x: 100, y: 100 }, [a, b], null, 100, 180) === a,
      "acquire",
    );
    assert(
      resolveTarget({ x: 245, y: 100 }, [a, b], a, 100, 180) === b,
      "switch compatible",
    );
    assert(
      resolveTarget({ x: 100, y: 245 }, [a, b], a, 100, 180) === a,
      "retain",
    );
    assert(!resolveTarget({ x: 100, y: 400 }, [a, b], a, 100, 180), "cancel");
    results.push(
      "PASS pure target acquisition, switching, hysteresis, cancellation",
    );
    for (const size of [
      { width: 1180, height: 820 },
      { width: 900, height: 600 },
      { width: 768, height: 1024 },
    ]) {
      const frame = document.createElement("iframe");
      frame.width = size.width;
      frame.height = size.height;
      frame.src = "../index.html?test=1";
      document.querySelector("#frames").replaceChildren(frame);
      await new Promise((r) => (frame.onload = r));
      const win = frame.contentWindow,
        doc = win.document,
        c = doc.querySelector("canvas");
      await until(
        () => win.ForestPups?.snapshot().state.phase === "puzzle",
        "load",
      );
      const S = () => win.ForestPups.snapshot();
      function pointer(type, x, y, id = 1) {
        const rect = c.getBoundingClientRect();
        c.dispatchEvent(
          new win.PointerEvent(type, {
            pointerId: id,
            pointerType: "touch",
            isPrimary: id === 1,
            clientX: x + rect.left,
            clientY: y + rect.top,
            buttons: type === "pointerup" ? 0 : 1,
            bubbles: true,
            cancelable: true,
          }),
        );
      }
      function reset() {
        win.ForestPups.openDebug();
        doc.querySelector("#reset").click();
        doc.querySelector("#close").click();
      }
      reset();
      let s = S(),
        p = s.state.pieces[0];
      const hotspot = doc.querySelector("#parent");
      hotspot.dispatchEvent(
        new win.PointerEvent("pointerdown", {
          pointerId: 99,
          clientX: 10,
          clientY: 10,
        }),
      );
      hotspot.dispatchEvent(
        new win.PointerEvent("pointerup", { pointerId: 99 }),
      );
      await sleep(100);
      assert(!doc.querySelector("#debug").open, "short hold stays closed");
      hotspot.dispatchEvent(
        new win.PointerEvent("pointerdown", {
          pointerId: 99,
          clientX: 10,
          clientY: 10,
        }),
      );
      await sleep(1600);
      assert(doc.querySelector("#debug").open, "1.5-second parent gate");
      hotspot.dispatchEvent(
        new win.PointerEvent("pointerup", { pointerId: 99 }),
      );
      doc.querySelector("#close").click();
      const frameTimes = [];
      let prior = performance.now(),
        collect = true;
      function sample(t) {
        frameTimes.push(t - prior);
        prior = t;
        if (collect) win.requestAnimationFrame(sample);
      }
      win.requestAnimationFrame(sample);
      const loadTimer =
        size.width === 900
          ? win.setInterval(() => {
              const stop = performance.now() + 20;
              while (performance.now() < stop) {}
            }, 70)
          : null;

      // Every active source hitbox and destination must remain outside Wolf's envelope.
      function geometry() {
        const v = S();
        for (let i = 0; i < v.state.pieces.length; i++) {
          const p = v.state.pieces[i];
          assert(
            v.state.level === 6
              ? p.home.y + v.hitRadii[i] < v.wolfBounds.top
              : p.home.x - v.hitRadii[i] > v.wolfBounds.right,
            "Wolf/source separation",
          );
          assert(
            v.state.level === 6
              ? p.target.y + p.radius < v.wolfBounds.top
              : p.target.x - p.radius > v.wolfBounds.right,
            "Wolf/target separation",
          );
        }
        if (v.state.level === 6) {
          assert(
            v.state.pieces.map((p) => p.type).join(",") ===
              "sun,mercury,venus,earth,mars,jupiter,saturn,uranus,neptune",
            "exact order",
          );
          assert(
            v.hitRadii.every((r) => Math.abs(r - v.hitRadii[0]) < 0.01),
            "equal minimum touch targets including Mercury",
          );
          for (let i = 1; i < v.state.targets.length; i++)
            assert(
              v.state.targets[i].x > v.state.targets[i - 1].x,
              "left-to-right order",
            );
        }
      }
      geometry();
      // Cancel a retained target rather than accidentally completing it.
      pointer("pointerdown", p.x, p.y);
      pointer("pointermove", p.target.x, p.target.y + 16);
      assert(S().drag.lock, "cancel fixture lock");
      pointer("pointercancel", p.target.x, p.target.y);
      assert(!S().state.pieces[0].done, "locked cancel returns");
      await sleep(370);
      // Resize during acquisition; listeners must safely release ownership and relayout.
      pointer("pointerdown", p.x, p.y);
      frame.width = size.width - 20;
      await sleep(120);
      assert(!S().drag, "resize cancels");
      frame.width = size.width;
      await sleep(120);
      s = S();
      p = s.state.pieces[0];
      pointer("pointerdown", p.x + s.R + 12, p.y);
      assert(S().drag, "padded pickup");
      assert(
        S().events.at(-1).type === "capture_unavailable" ||
          S().events.some(
            (e) =>
              e.type === "piece_acquired" && e.hitRegion === "extended_bounds",
          ),
        "extended telemetry",
      );
      pointer("pointerdown", p.x, p.y, 2);
      pointer("pointerup", p.x, p.y, 2);
      assert(S().drag.id === 1, "extra finger ownership");
      pointer("pointercancel", p.x, p.y);
      assert(!S().drag, "cancel drag");
      await sleep(370);
      assert(!S().state.pieces[0].done, "cancel does not place");
      s = S();
      p = s.state.pieces[0];
      for (let i = 0; i < 3; i++) {
        pointer("pointerdown", p.x, p.y);
        pointer("pointerup", p.x, p.y);
        await sleep(340);
      }
      assert(
        S().events.some((e) => e.type === "empty_space_release"),
        "empty release",
      );
      pointer("pointerdown", p.x, p.y);
      pointer("pointermove", p.target.x, p.target.y + 16);
      assert(S().drag.lock, "acquire");
      pointer("pointermove", p.home.x, p.home.y);
      assert(!S().drag.lock, "clear cancel");
      pointer("pointerup", p.home.x, p.home.y);
      await sleep(360);
      assert(
        S().events.some((e) => e.type === "pointer_up_after_target_lost"),
        "lost telemetry",
      );
      pointer("pointerdown", p.home.x, p.home.y);
      pointer("pointermove", p.target.x, p.target.y + 16);
      for (let repeat = 0; repeat < 2; repeat++) {
        pointer("pointermove", p.home.x, p.home.y);
        assert(!S().drag.lock, "deliberate abandonment");
        pointer("pointermove", p.target.x, p.target.y + 16);
        assert(S().drag.lock, "reacquisition");
      }
      assert(S().drag.reacquisitions === 2, "same target reacquisition count");
      pointer("pointermove", p.target.x - s.R * 2.7, p.target.y + 16);
      assert(S().drag.lock, "wobble retains lock");
      pointer("pointerup", p.target.x - s.R * 2.8, p.target.y + 20);
      assert(S().state.pieces[0].done, "wobble success");
      const end = S()
        .events.filter((e) => e.type === "drag_end")
        .at(-1);
      assert(
        end.maximumDistanceAfterLock > s.R * 2.7,
        "maximum distance reported",
      );
      assert(end.reacquisitions === 2, "exported reacquisitions");
      await until(() => S().state.phase === "portal", "first portal");
      for (let level = 0; level < 7; level++) {
        s = S();
        geometry();
        assert(s.state.level === level, "level sequence");
        if (level > 0) {
          if (level === 1 || level === 4 || level === 5 || level === 6) {
            p = s.state.pieces[0];
            const wrong = s.state.targets[1];
            pointer("pointerdown", p.x, p.y);
            pointer("pointermove", wrong.x, wrong.y + 16);
            pointer("pointerup", wrong.x, wrong.y + 16);
            await sleep(360);
            assert(
              S().events.some((e) => e.type === "incorrect_target_attempt"),
              "wrong target",
            );
          }
          s = S();
          const wolf = { x: s.state.wolf.x * s.W, y: s.state.wolf.y * s.H };
          pointer("pointerdown", s.wolfBounds.left + 4, wolf.y);
          assert(!S().drag, "Wolf tap does not start drag");
          pointer("pointermove", s.W * 0.7, s.H * 0.3);
          pointer("pointerup", s.W * 0.7, s.H * 0.3);
          assert(
            S().state.wolf.x === s.state.wolf.x &&
              S().state.wolf.y === s.state.wolf.y,
            "Wolf remains fixed",
          );
          assert(
            S().events.some((e) => e.type === "wolf_tapped"),
            "Wolf tap hook logged",
          );
          if (level === 6) {
            for (const piece of s.state.pieces) {
              pointer(
                "pointerdown",
                piece.home.x + piece.radius + 20,
                piece.home.y,
              );
              assert(
                S().drag?.piece.type === piece.type,
                "extended planet pickup " + piece.type,
              );
              pointer("pointercancel", piece.home.x, piece.home.y);
              await sleep(350);
            }
          }
          for (const piece of s.state.pieces) {
            pointer("pointerdown", piece.home.x, piece.home.y);
            assert(S().drag?.piece.type === piece.type, "correct piece pickup");
            pointer("pointermove", piece.target.x, piece.target.y + 16);
            pointer("pointerup", piece.target.x, piece.target.y + 16);
          }
          await until(() => S().state.phase === "portal", "portal " + level);
        }
        s = S();
        pointer("pointerdown", s.state.wolf.x * s.W, s.state.wolf.y * s.H);
        pointer("pointermove", s.state.portal.x, s.state.portal.y);
        assert(S().drag.lock, "portal lock");
        pointer("pointerup", s.state.portal.x - 5, s.state.portal.y + 7);
        await until(
          () =>
            level === 6
              ? S().state.phase === "final"
              : S().state.level === level + 1 && S().state.phase === "puzzle",
          "transition",
        );
        await sleep(650);
      }
      s = S();
      const before = s.events.filter((e) => e.type === "friend_touched").length;
      pointer("pointerdown", s.W * 0.64, s.H * 0.55);
      pointer("pointerup", s.W * 0.64, s.H * 0.55);
      assert(
        S().events.filter((e) => e.type === "friend_touched").length ===
          before + 1,
        "final interaction",
      );
      assert(
        s.events.filter((e) => e.type === "final_completion").length === 1,
        "final event",
      );
      assert(
        s.events.filter((e) => e.type === "portal_interaction").length === 7,
        "seven portals",
      );
      assert(
        s.events.filter((e) => e.type === "correct_match").length === 27,
        "twenty-seven matches",
      );
      win.ForestPups.openDebug();
      const raw = JSON.parse(doc.querySelector("#raw").value);
      assert(
        raw.prototype === "Forest Pups 01.2" &&
          raw.levelDefinitions.length === 7,
        "raw telemetry schema",
      );
      let exported = null;
      const originalClick = win.HTMLAnchorElement.prototype.click;
      win.HTMLAnchorElement.prototype.click = function () {
        exported = this.href;
      };
      doc.querySelector("#export").click();
      win.HTMLAnchorElement.prototype.click = originalClick;
      const json = await (await fetch(exported)).json();
      assert(
        json.events.some((e) => e.type === "target_reacquired"),
        "JSON export",
      );
      assert(
        doc.querySelectorAll("#level-picker option").length === 7,
        "all activities in picker",
      );
      for (let i = 0; i < 7; i++) {
        doc.querySelector("#level-picker").value = String(i);
        doc.querySelector("#jump-level").click();
        assert(
          S().state.level === i && S().state.phase === "puzzle",
          "picker jump " + i,
        );
      }
      doc.querySelector("#restart").click();
      doc.querySelector("#close").click();
      assert(S().state.level === 0, "restart");
      reset();
      assert(
        !S().events.some((e) => e.type === "correct_match"),
        "reset events",
      );
      collect = false;
      if (loadTimer) win.clearInterval(loadTimer);
      frameTimes.sort((a, b) => a - b);
      results.push(
        `Frame intervals ${size.width}px: median ${Math.round(frameTimes[Math.floor(frameTimes.length * 0.5)])}ms, p95 ${Math.round(frameTimes[Math.floor(frameTimes.length * 0.95)])}ms${loadTimer ? " with 20ms main-thread stalls every 70ms" : ""}`,
      );
      results.push(
        `PASS ${size.width} × ${size.height}: padded pickup, extra fingers, cancellation, repeated taps, empty/wrong release, acquire/cancel, release wobble, all 27 matches, 7 portals, final reunion, replay, telemetry reset`,
      );
      result.textContent = results.join("\n");
    }
    result.textContent =
      results.join("\n") +
      "\nALL TESTS PASSED — includes safe geometry, resize cancellation, locked cancellation, fixed Wolf tap reaction and final interaction";
  } catch (e) {
    result.textContent = results.join("\n") + "\nFAIL " + e.stack;
  } finally {
    document.querySelector("#run").disabled = false;
  }
};
