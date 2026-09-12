import { resolveTarget } from "../config.js";
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
      await sleep(4150);
      assert(doc.querySelector("#debug").open, "four-second parent gate");
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
        const v = S(),
          ww = Math.min(v.W * 0.19, v.H * 0.29),
          right = v.W * 0.27;
        for (const p of v.state.pieces) {
          assert(p.home.x - v.R - 20 > right, "Wolf/source hitbox separation");
          assert(p.target.x - v.R > right, "Wolf/slot separation");
        }
        for (let i = 0; i < v.state.pieces.length; i++)
          for (let j = i + 1; j < v.state.pieces.length; j++) {
            const a = v.state.pieces[i].home,
              b = v.state.pieces[j].home;
            assert(
              Math.hypot(a.x - b.x, a.y - b.y) > 2 * (v.R + 20),
              "source hitbox separation",
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
      pointer("pointermove", p.target.x - s.R * 1.95, p.target.y + 16);
      assert(S().drag.lock, "wobble retains lock");
      pointer("pointerup", p.target.x - s.R * 2, p.target.y + 20);
      assert(S().state.pieces[0].done, "wobble success");
      await until(() => S().state.phase === "portal", "first portal");
      for (let level = 0; level < 4; level++) {
        s = S();
        geometry();
        assert(s.state.level === level, "level sequence");
        if (level > 0) {
          if (level === 1) {
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
          pointer("pointerdown", wolf.x, wolf.y);
          pointer("pointermove", wolf.x, s.H * 0.4);
          assert(
            S().state.wolf.y === 0.6,
            "real Wolf stays at origin during drag",
          );
          pointer("pointerup", wolf.x, s.H * 0.4);
          await sleep(500);
          assert(
            Math.abs(S().state.wolf.y - 0.4) < 0.01,
            "valid Wolf destination",
          );
          s = S();
          wolf.y = s.state.wolf.y * s.H;
          pointer("pointerdown", wolf.x, wolf.y);
          assert(S().drag.kind === "wolf", "wolf pickup");
          pointer("pointermove", s.state.pieces[0].x, s.state.pieces[0].y);
          assert(S().drag.ghost.x < S().W * 0.28, "ghost kept separate");
          pointer("pointerup", s.state.pieces[0].x, s.state.pieces[0].y);
          assert(S().state.wolf.x < 0.28, "wolf kept separate");
          for (const piece of s.state.pieces) {
            pointer("pointerdown", piece.home.x, piece.home.y);
            assert(S().drag?.kind === "piece", "piece pickup");
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
            level === 3
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
        s.events.filter((e) => e.type === "portal_interaction").length === 4,
        "four portals",
      );
      assert(
        s.events.filter((e) => e.type === "correct_match").length === 10,
        "ten matches",
      );
      win.ForestPups.openDebug();
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
        `PASS ${size.width} × ${size.height}: padded pickup, extra fingers, cancellation, repeated taps, empty/wrong release, acquire/cancel, release wobble, all 10 matches, 4 portals, final reunion, replay, telemetry reset`,
      );
      result.textContent = results.join("\n");
    }
    result.textContent =
      results.join("\n") +
      "\nALL TESTS PASSED — includes safe geometry, resize cancellation, locked cancellation, valid Wolf relocation and final interaction";
  } catch (e) {
    result.textContent = results.join("\n") + "\nFAIL " + e.stack;
  } finally {
    document.querySelector("#run").disabled = false;
  }
};
