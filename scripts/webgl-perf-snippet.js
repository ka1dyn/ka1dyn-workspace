/**
 * WebGL page performance snippet (see docs/perf-measurement.md §11)
 *
 * Usage:
 *   - Chrome DevTools → Sources → Snippets → New snippet → paste → Run (Cmd+Enter)
 *     or paste directly into the Console.
 *   - threejs.org examples run inside an iframe: open the example URL directly
 *     (threejs.org/examples/webgl_xxx.html) or switch the Console context to the iframe.
 *   - Prints every 5s. Stop with `window.__perfStop()`.
 *
 * Reports: fps, frame interval median/p95, ratio of frames that actually drew,
 * draw calls & vertices per drawn frame, canvas resolution, DPR, GPU renderer.
 *
 * Not measured: GPU time (timer queries are inflated on macOS Chrome / ANGLE Metal),
 * ANGLE_instanced_arrays (WebGL1) and WEBGL_multi_draw calls.
 */
(() => {
  if (window.__perfStop) window.__perfStop();

  const stat = { calls: 0, verts: 0 };
  const restore = [];

  const wrap = (proto, name, countIdx, instIdx) => {
    const orig = proto[name];
    if (!orig) return;
    proto[name] = function (...a) {
      stat.calls++;
      stat.verts += a[countIdx] * (instIdx != null ? a[instIdx] : 1);
      return orig.apply(this, a);
    };
    restore.push(() => (proto[name] = orig));
  };

  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!C) continue;
    const p = C.prototype;
    wrap(p, "drawArrays", 2); // (mode, first, count)
    wrap(p, "drawElements", 1); // (mode, count, type, offset)
    wrap(p, "drawArraysInstanced", 2, 3); // (+ instanceCount)
    wrap(p, "drawElementsInstanced", 1, 4);
    wrap(p, "drawRangeElements", 3); // (mode, start, end, count, ...)
  }

  // GPU renderer string
  const probe = document.createElement("canvas").getContext("webgl2");
  const dbg = probe && probe.getExtension("WEBGL_debug_renderer_info");
  const renderer = dbg ? probe.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "?";

  let frames = [];
  let last = null;
  let raf;
  const loop = (t) => {
    if (last !== null) frames.push({ dt: t - last, calls: stat.calls, verts: stat.verts });
    last = t;
    stat.calls = 0;
    stat.verts = 0;
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const pct = (arr, p) => {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor(s.length * p))];
  };
  const avg = (arr, k) => arr.reduce((s, x) => s + x[k], 0) / (arr.length || 1);

  const timer = setInterval(() => {
    const f = frames.filter((x) => x.dt < 250); // ignore tab switches / stalls
    frames = [];
    if (!f.length) return;
    const drawn = f.filter((x) => x.calls > 0);
    const intervals = f.map((x) => x.dt);
    const canvases = [...document.querySelectorAll("canvas")]
      .filter((c) => c.width * c.height > 0)
      .map((c) => `${c.width}x${c.height} (${((c.width * c.height) / 1e6).toFixed(2)}MP)`);

    console.log(
      `[perf] fps ${(1000 / (avg(f, "dt") || 1)).toFixed(1)} | interval median ${pct(intervals, 0.5).toFixed(2)} p95 ${pct(intervals, 0.95).toFixed(2)}ms\n` +
        `       drawn frames ${drawn.length}/${f.length} (${Math.round((drawn.length / f.length) * 100)}%)\n` +
        `       per drawn frame: calls ${avg(drawn, "calls").toFixed(0)}, verts ${(avg(drawn, "verts") / 1e3).toFixed(1)}k\n` +
        `       canvas ${canvases.join(", ") || "-"} | DPR ${devicePixelRatio} | ${renderer}`,
    );
  }, 5000);

  window.__perfStop = () => {
    cancelAnimationFrame(raf);
    clearInterval(timer);
    restore.forEach((undo) => undo());
    delete window.__perfStop;
    console.log("[perf] stopped");
  };
  console.log("[perf] started — window.__perfStop() to stop");
})();
