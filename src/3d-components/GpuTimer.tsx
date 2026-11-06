import { addAfterEffect, addEffect, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type * as THREE from "three";

/**
 * Per-frame performance monitor (see docs/perf-measurement.md).
 *
 * Frame = R3F `addEffect` (before every useFrame) -> `addAfterEffect` (after render).
 *
 * - GPU: every top-level `renderer.render` call inside a frame is wrapped in its
 *   own TIME_ELAPSED query and summed. A frame only counts once all of its
 *   passes have resolved without a GPU disjoint event or query conflict.
 * - CPU: wall time from `addEffect` to `addAfterEffect` (all useFrame + render submission).
 * - Frame interval: rAF timestamp delta -> effective frame cap / budget.
 * - Draw stats: `gl.info` summed over the whole frame (autoReset disabled),
 *   vertices counted in `renderBufferDirect`.
 *
 * Do not run together with stats-gl(trackGPU) / r3f-perf: WebGL2 allows only one
 * active TIME_ELAPSED query, so they corrupt each other. Conflicts are reported.
 *
 * Not included: GL work outside `renderer.render` and the browser compositor.
 */

type TimerQueryExt = {
  TIME_ELAPSED_EXT: number;
  GPU_DISJOINT_EXT: number;
};

interface FrameRecord {
  // GPU
  passes: (number | null)[];
  labels: string[];
  outstanding: number;
  invalid: boolean;
  // CPU / interval
  start: number | null;
  cpuMs: number | null;
  intervalMs: number | null;
  // Draw stats
  calls: number;
  triangles: number;
  lines: number;
  points: number;
  vertices: number;
}

interface PendingQuery {
  query: WebGLQuery;
  frame: FrameRecord;
  index: number;
}

export interface Distribution {
  avg: number;
  p95: number;
  min: number;
  max: number;
}

export type FrameVerdict = "capped" | "gpu-bound" | "cpu-bound" | "unknown";

/** Compute Pressure API state (Chrome 125+, "cpu" source only; includes thermal state) */
export type PressureState = "nominal" | "fair" | "serious" | "critical";

interface PressureRecordLike {
  state: PressureState;
}
interface PressureObserverLike {
  observe(source: "cpu", options?: { sampleInterval?: number }): Promise<void>;
  disconnect(): void;
}
type PressureObserverCtor = new (callback: (records: PressureRecordLike[]) => void) => PressureObserverLike;

export interface FrameReport {
  windowSec: number;
  /** Frames closed in this window (CPU / interval / draw stats) */
  frames: number;
  /** Frames with a complete, valid GPU measurement */
  gpuFrames: number;
  /** Effective frame cap from rAF intervals */
  frame: { medianMs: number; p95Ms: number; hz: number } | null;
  gpu: Distribution | null;
  cpu: Distribution | null;
  /** Usage of the frame budget (0..1+) */
  gpuUtil: number | null;
  cpuUtil: number | null;
  verdict: FrameVerdict;
  passes: { key: string; avgMs: number; count: number }[];
  /** Per-frame averages, summed over all passes */
  draw: { calls: number; triangles: number; vertices: number; lines: number; points: number };
  memory: { geometries: number; textures: number; programs: number; jsHeapMB: number | null };
  /** System CPU pressure (null if unsupported). Global state, affected by other apps */
  pressure: PressureState | null;
  discarded: number;
  conflicts: number;
}

interface GpuTimerProps {
  /** Stats window / report interval in ms */
  intervalMs?: number;
  /** Show the text overlay */
  overlay?: boolean;
  /** Also print each report to the console */
  log?: boolean;
  /** Called on every report (e.g. for adaptive quality) */
  onReport?: (report: FrameReport) => void;
}

const MAX_PENDING = 300;
const MAX_INTERVAL_MS = 250; // larger gaps = tab switch / stall, ignored
const CAPPED_UTIL = 0.7; // below this (CPU and GPU) with stable interval -> capped
const STABLE_INTERVAL_RATIO = 1.15; // interval p95 / median

function createOverlay() {
  const el = document.createElement("pre");
  Object.assign(el.style, {
    position: "fixed",
    left: "8px",
    bottom: "8px",
    margin: "0",
    padding: "6px 8px",
    zIndex: "10000003",
    pointerEvents: "none",
    background: "rgba(0, 0, 0, 0.75)",
    color: "#7CFC00",
    font: "11px/1.4 ui-monospace, Menlo, monospace",
    whiteSpace: "pre",
    borderRadius: "4px",
  } satisfies Partial<CSSStyleDeclaration>);
  el.textContent = "GPU timer: waiting for frames...";
  document.body.appendChild(el);
  return el;
}

function distribution(values: number[]): Distribution | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    avg: sum / sorted.length,
    p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))],
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const ms = (v: number) => v.toFixed(2);
const pct = (v: number | null) => (v === null ? "-" : `${Math.round(v * 100)}%`);
const count = (v: number) =>
  v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}k` : `${Math.round(v)}`;

/** Vertices submitted by one draw, mirroring WebGLRenderer.renderBufferDirect (three r181) */
function countVertices(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  object: THREE.Object3D,
  group: THREE.Group | { start: number; count: number } | null,
) {
  const position = geometry.attributes.position;
  const index = geometry.index;
  if (!index && !position) return 0;

  // Wireframe draws a line index with 2 indices per triangle edge pair (~2x)
  const wireframe = (material as { wireframe?: boolean }).wireframe === true;
  const rangeFactor = wireframe ? 2 : 1;

  let drawStart = geometry.drawRange.start * rangeFactor;
  let drawEnd = (geometry.drawRange.start + geometry.drawRange.count) * rangeFactor;
  if (group && "start" in group) {
    drawStart = Math.max(drawStart, group.start * rangeFactor);
    drawEnd = Math.min(drawEnd, (group.start + group.count) * rangeFactor);
  }
  const dataCount = (index ? index.count : position.count) * rangeFactor;
  drawStart = Math.max(drawStart, 0);
  drawEnd = Math.min(drawEnd, dataCount);
  const drawCount = drawEnd - drawStart;
  if (drawCount <= 0 || !Number.isFinite(drawCount)) return 0;

  let instances = 1;
  const inst = object as { isInstancedMesh?: boolean; count?: number };
  const instGeo = geometry as { isInstancedBufferGeometry?: boolean; instanceCount?: number };
  if (inst.isInstancedMesh) instances = inst.count ?? 1;
  else if (instGeo.isInstancedBufferGeometry) instances = instGeo.instanceCount ?? 1;
  if (!Number.isFinite(instances)) instances = 1;

  // Note: BatchedMesh (multi-draw) is counted as its full geometry range
  return drawCount * instances;
}

export default function GpuTimer({
  intervalMs = 1000,
  overlay: showOverlay = true,
  log = false,
  onReport,
}: GpuTimerProps) {
  const gl = useThree((state) => state.gl);

  // Keep callbacks out of the effect deps so patches aren't re-installed every render
  const logRef = useRef(log);
  const onReportRef = useRef(onReport);
  useEffect(() => {
    logRef.current = log;
    onReportRef.current = onReport;
  }, [log, onReport]);

  useEffect(() => {
    const overlay = showOverlay ? createOverlay() : null;
    const setOverlay = (text: string) => {
      if (overlay) overlay.textContent = text;
    };
    const ctx = gl.getContext();

    // GPU timing is optional: everything else still works without it
    let ext: TimerQueryExt | null = null;
    if (ctx instanceof WebGL2RenderingContext) {
      ext = ctx.getExtension("EXT_disjoint_timer_query_webgl2") as TimerQueryExt | null;
    }
    const gl2 = ext ? (ctx as WebGL2RenderingContext) : null;

    let current: FrameRecord | null = null;
    let depth = 0;
    let lastTimestamp: number | null = null;
    const pending: PendingQuery[] = [];
    const awaiting: FrameRecord[] = []; // closed frames waiting for GPU results, in order
    let closed: FrameRecord[] = []; // all closed frames in this window
    let completed: FrameRecord[] = []; // frames with a valid GPU total in this window
    let discarded = 0;
    let conflicts = 0;
    let windowStart = performance.now();

    // --- Compute Pressure (optional): thermal / load hint, no GPU source yet
    let pressure: PressureState | null = null;
    let pressureObserver: PressureObserverLike | null = null;
    const PressureObserverImpl = (globalThis as { PressureObserver?: PressureObserverCtor })
      .PressureObserver;
    if (PressureObserverImpl) {
      try {
        pressureObserver = new PressureObserverImpl((records) => {
          const last = records[records.length - 1];
          if (last) pressure = last.state;
        });
        pressureObserver
          .observe("cpu", { sampleInterval: Math.max(1000, intervalMs) })
          .catch(() => {
            // Blocked by permissions policy / unsupported source
            pressureObserver = null;
          });
      } catch {
        pressureObserver = null;
      }
    }

    const newFrame = (): FrameRecord => ({
      passes: [],
      labels: [],
      outstanding: 0,
      invalid: false,
      start: null,
      cpuMs: null,
      intervalMs: null,
      calls: 0,
      triangles: 0,
      lines: 0,
      points: 0,
      vertices: 0,
    });

    const openFrame = (): FrameRecord => {
      current = newFrame();
      return current;
    };

    const closeFrame = () => {
      const frame = current;
      if (!frame) return;
      current = null;
      if (frame.start !== null) frame.cpuMs = performance.now() - frame.start;

      const render = gl.info.render;
      frame.calls = render.calls;
      frame.triangles = render.triangles;
      frame.lines = render.lines;
      frame.points = render.points;

      const rendered = frame.passes.length > 0 || frame.invalid || frame.calls > 0;
      if (!rendered) return;
      closed.push(frame);
      if (gl2 && (frame.passes.length > 0 || frame.invalid)) awaiting.push(frame);
    };

    const resetWindow = () => {
      closed = [];
      completed = [];
      discarded = 0;
      conflicts = 0;
      windowStart = performance.now();
    };

    // --- gl.info: accumulate across all passes of a frame
    const prevAutoReset = gl.info.autoReset;
    gl.info.autoReset = false;

    // --- Patch renderer.render: one TIME_ELAPSED query per top-level render call
    const originalRender = gl.render;
    gl.render = (scene: THREE.Object3D, camera: THREE.Camera) => {
      if (depth > 0) {
        // Nested render: already covered by the outer query
        depth++;
        try {
          originalRender.call(gl, scene, camera);
        } finally {
          depth--;
        }
        return;
      }

      const frame = current ?? openFrame();
      let query: WebGLQuery | null = null;
      let label = "";

      if (gl2 && ext) {
        const target = gl.getRenderTarget();
        label = target ? `RT ${target.width}x${target.height}` : "screen";
        if (gl2.getQuery(ext.TIME_ELAPSED_EXT, gl2.CURRENT_QUERY)) {
          // Another timer (stats-gl / r3f-perf) owns the query slot
          conflicts++;
          frame.invalid = true;
        } else {
          query = gl2.createQuery();
          if (query) gl2.beginQuery(ext.TIME_ELAPSED_EXT, query);
        }
      }

      depth++;
      try {
        originalRender.call(gl, scene, camera);
      } finally {
        depth--;
        if (gl2 && ext && query) {
          if (gl2.getQuery(ext.TIME_ELAPSED_EXT, gl2.CURRENT_QUERY) === query) {
            gl2.endQuery(ext.TIME_ELAPSED_EXT);
            const index = frame.passes.length;
            frame.passes.push(null);
            frame.labels.push(label);
            frame.outstanding++;
            pending.push({ query, frame, index });
          } else {
            // Someone else ended our query mid-render
            conflicts++;
            frame.invalid = true;
            gl2.deleteQuery(query);
          }
        }
      }
    };

    // --- Patch renderBufferDirect: count submitted vertices
    const originalRenderBufferDirect = gl.renderBufferDirect;
    gl.renderBufferDirect = (...args: Parameters<THREE.WebGLRenderer["renderBufferDirect"]>) => {
      const [, , geometry, material, object, group] = args;
      const frame = current ?? openFrame();
      frame.vertices += countVertices(geometry, material, object, group);
      originalRenderBufferDirect.apply(gl, args);
    };

    const dropAllPending = () => {
      if (!gl2) return;
      for (const p of pending) {
        p.frame.invalid = true;
        p.frame.outstanding--;
        gl2.deleteQuery(p.query);
      }
      pending.length = 0;
    };

    const poll = () => {
      if (!gl2 || !ext || pending.length === 0) return;

      if (gl2.getParameter(ext.GPU_DISJOINT_EXT)) {
        // Timing is unreliable for everything in flight
        dropAllPending();
        return;
      }

      for (let i = 0; i < pending.length; ) {
        const p = pending[i];
        if (!gl2.getQueryParameter(p.query, gl2.QUERY_RESULT_AVAILABLE)) {
          i++;
          continue;
        }
        const ns = gl2.getQueryParameter(p.query, gl2.QUERY_RESULT) as number;
        p.frame.passes[p.index] = ns / 1e6;
        p.frame.outstanding--;
        gl2.deleteQuery(p.query);
        pending.splice(i, 1);
      }

      if (pending.length > MAX_PENDING) dropAllPending();
    };

    const finalize = () => {
      while (awaiting.length > 0 && awaiting[0].outstanding === 0) {
        const frame = awaiting.shift()!;
        if (frame.invalid) discarded++;
        else completed.push(frame);
      }
    };

    const buildReport = (windowSec: number): FrameReport => {
      const intervals = closed.map((f) => f.intervalMs).filter((v): v is number => v !== null);
      let frameInfo: FrameReport["frame"] = null;
      if (intervals.length > 0) {
        const medianMs = median(intervals);
        frameInfo = { medianMs, p95Ms: distribution(intervals)!.p95, hz: 1000 / medianMs };
      }

      const gpu = distribution(
        completed.map((f) => f.passes.reduce<number>((sum, v) => sum + (v ?? 0), 0)),
      );
      const cpu = distribution(closed.map((f) => f.cpuMs).filter((v): v is number => v !== null));

      const budget = frameInfo?.medianMs ?? null;
      const gpuUtil = budget && gpu ? gpu.avg / budget : null;
      const cpuUtil = budget && cpu ? cpu.avg / budget : null;

      let verdict: FrameVerdict = "unknown";
      if (frameInfo && (gpuUtil !== null || cpuUtil !== null)) {
        const stable = frameInfo.p95Ms / frameInfo.medianMs <= STABLE_INTERVAL_RATIO;
        const g = gpuUtil ?? 0;
        const c = cpuUtil ?? 0;
        if (stable && g < CAPPED_UTIL && c < CAPPED_UTIL) verdict = "capped";
        else verdict = g >= c ? "gpu-bound" : "cpu-bound";
      }

      // Per-pass GPU averages, keyed by pass index + label
      const passStats = new Map<string, { sum: number; count: number }>();
      for (const f of completed) {
        f.passes.forEach((v, i) => {
          const key = `#${i} ${f.labels[i]}`;
          const s = passStats.get(key) ?? { sum: 0, count: 0 };
          s.sum += v ?? 0;
          s.count++;
          passStats.set(key, s);
        });
      }

      const n = closed.length || 1;
      const sum = (pick: (f: FrameRecord) => number) => closed.reduce((a, f) => a + pick(f), 0) / n;

      const perfMemory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;

      return {
        windowSec,
        frames: closed.length,
        gpuFrames: completed.length,
        frame: frameInfo,
        gpu,
        cpu,
        gpuUtil,
        cpuUtil,
        verdict,
        passes: [...passStats].map(([key, s]) => ({ key, avgMs: s.sum / s.count, count: s.count })),
        draw: {
          calls: sum((f) => f.calls),
          triangles: sum((f) => f.triangles),
          vertices: sum((f) => f.vertices),
          lines: sum((f) => f.lines),
          points: sum((f) => f.points),
        },
        memory: {
          geometries: gl.info.memory.geometries,
          textures: gl.info.memory.textures,
          programs: gl.info.programs?.length ?? 0,
          jsHeapMB: perfMemory ? perfMemory.usedJSHeapSize / 1048576 : null,
        },
        pressure,
        discarded,
        conflicts,
      };
    };

    const formatReport = (r: FrameReport) => {
      const verdictText = {
        capped: "capped(여유)",
        "gpu-bound": "GPU-bound",
        "cpu-bound": "CPU-bound",
        unknown: "-",
      }[r.verdict];
      const lines: string[] = [];
      lines.push(
        r.frame
          ? `FRAME  ${ms(r.frame.medianMs)}ms (${r.frame.hz.toFixed(1)}Hz)  p95 ${ms(r.frame.p95Ms)}  ${verdictText}`
          : "FRAME  -",
      );
      if (!ext) lines.push("GPU    timer query not supported");
      else if (r.gpu)
        lines.push(
          `GPU    avg ${ms(r.gpu.avg)}  p95 ${ms(r.gpu.p95)}  min ${ms(r.gpu.min)}  max ${ms(r.gpu.max)}  util ${pct(r.gpuUtil)}  (${r.gpuFrames}f)`,
        );
      else lines.push("GPU    no complete frames");
      lines.push(
        r.cpu
          ? `CPU    avg ${ms(r.cpu.avg)}  p95 ${ms(r.cpu.p95)}  util ${pct(r.cpuUtil)}`
          : "CPU    -",
      );
      for (const p of r.passes) lines.push(`  ${p.key}: ${ms(p.avgMs)}ms (${p.count}x)`);
      lines.push(
        `DRAW   calls ${count(r.draw.calls)}  tris ${count(r.draw.triangles)}  verts ${count(r.draw.vertices)}  lines ${count(r.draw.lines)}  points ${count(r.draw.points)}`,
      );
      lines.push(
        `MEM    geo ${r.memory.geometries}  tex ${r.memory.textures}  programs ${r.memory.programs}` +
          (r.memory.jsHeapMB !== null ? `  heap ${r.memory.jsHeapMB.toFixed(0)}MB` : ""),
      );
      lines.push(`SYS    cpu pressure ${r.pressure ?? "n/a"}`);
      lines.push(`discarded ${r.discarded}  conflicts ${r.conflicts}`);
      if (r.conflicts > 0) lines.push("! another GPU timer (stats-gl / r3f-perf) is active - disable it");
      return lines.join("\n");
    };

    const report = () => {
      const now = performance.now();
      if (now - windowStart < intervalMs) return;
      const r = buildReport((now - windowStart) / 1000);
      const text = formatReport(r);
      setOverlay(text);
      if (logRef.current) console.log(text);
      onReportRef.current?.(r);
      resetWindow();
    };

    // --- Frame boundaries
    const unsubBefore = addEffect((timestamp) => {
      closeFrame(); // close any frame left open (renders outside the loop)
      const frame = openFrame();
      frame.start = performance.now();
      if (lastTimestamp !== null) {
        const delta = timestamp - lastTimestamp;
        if (delta > 0 && delta <= MAX_INTERVAL_MS) frame.intervalMs = delta;
      }
      lastTimestamp = timestamp;
      gl.info.reset();
    });
    const unsubAfter = addAfterEffect(() => {
      closeFrame();
      poll();
      finalize();
      report();
    });

    // Tab hidden -> rAF stops; start a fresh window when it comes back
    const onVisibility = () => {
      lastTimestamp = null;
      if (document.visibilityState === "visible") resetWindow();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      unsubBefore();
      unsubAfter();
      document.removeEventListener("visibilitychange", onVisibility);
      gl.render = originalRender;
      gl.renderBufferDirect = originalRenderBufferDirect;
      gl.info.autoReset = prevAutoReset;
      if (gl2) for (const p of pending) gl2.deleteQuery(p.query);
      pending.length = 0;
      pressureObserver?.disconnect();
      overlay?.remove();
    };
  }, [gl, intervalMs, showOverlay]);

  return null;
}
