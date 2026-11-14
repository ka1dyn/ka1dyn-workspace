import { addAfterEffect, addEffect, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { getVram } from "./vram";

// 매 프레임 R3F 루프의 앞(addEffect, 모든 useFrame 이전)과 뒤(addAfterEffect, 렌더 이후)에서
// 시간을 재고, 그 사이에 나간 GPU 명령 전체를 타이머 쿼리 하나로 감싼다.
// 화면 갱신은 0.5초마다 DOM에 직접 써서 React 렌더 비용을 측정에 섞지 않는다.

const POWER_URL = "http://127.0.0.1:7071/power";
const WINDOW_MS = 1000;

interface Power {
  mhz: number; // GPU 활성 시간 가중 평균 클럭
  gpuMw: number;
  cpuMw: number | null;
  active: number; // GPU 활성 비율 0~1
  thermal: string;
  t: number;
}

// Chrome GPU 프로세스 메모리 (브리지가 footprint로 읽음). 모든 탭과 브라우저 UI가 섞인 값이다.
interface Mem {
  graphics: number; // IOAccelerator (graphics): Metal GPU 자원 (WebGL 텍스처·버퍼·렌더 타깃 등)
  iosurface: number; // IOSurface: 화면 합성용 공유 버퍼 (캔버스 출력, DOM 레이어 등)
  t: number;
}

interface TimerExt {
  TIME_ELAPSED_EXT: number;
  GPU_DISJOINT_EXT: number;
}

const median = (xs: number[]) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const pct = (xs: number[], p: number) => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};
const f = (x: number | null | undefined, d = 2) =>
  x == null || Number.isNaN(x) ? "–" : x.toFixed(d);

export default function LabProbe({ gpuTimer = true }: { gpuTimer?: boolean }) {
  // eslint는 훅이 돌려준 값의 수정을 막지만, renderer 설정을 바꾸는 것이 이 컴포넌트의 목적이다.
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const ctx = gl.getContext() as WebGL2RenderingContext;
    // 콘솔에서 렌더러를 직접 확인할 수 있게 실험실에서만 노출한다 (예: __labGl.getContext().getContextAttributes())
    (window as unknown as { __labGl?: unknown }).__labGl = gl;
    // 다른 도구가 타이머 쿼리를 쓰는 동안에는 충돌을 피하려고 GPU 측정을 끈다.
    const ext = gpuTimer
      ? (ctx.getExtension("EXT_disjoint_timer_query_webgl2") as TimerExt | null)
      : null;

    // 후처리처럼 한 프레임에 render가 여러 번 불려도 합계를 보려고 자동 초기화를 끈다.
    const prevAutoReset = gl.info.autoReset;
    gl.info.autoReset = false;

    // ---- 프레임 단위 기록 (최근 1초) ----
    type Sample = {
      t: number;
      interval: number;
      cpu: number;
      render: number;
    };
    let samples: Sample[] = [];
    let gpu: { t: number; ms: number }[] = [];
    let lastStart = 0;
    let frameStart = 0;
    let renderStart = 0; // 이 프레임에서 renderer.render가 처음 시작된 시각
    let info = { calls: 0, triangles: 0 };

    // renderer.render가 시작되는 시점을 표시한다. CPU 시간을 useFrame 구간과 렌더 제출 구간으로 나누기 위함.
    // three는 render() 초반에 scene.onBeforeRender를 부른다.
    const prevSceneBefore = scene.onBeforeRender;
    scene.onBeforeRender = function (...args) {
      if (!renderStart) renderStart = performance.now();
      return prevSceneBefore.apply(this, args);
    };

    // ---- GPU 타이머 쿼리 (결과는 몇 프레임 뒤에 나오므로 대기열로 관리) ----
    let active: WebGLQuery | null = null;
    const pending: { q: WebGLQuery; t: number }[] = [];
    let queryError = false;

    const pollQueries = () => {
      if (!ext) return;
      const disjoint = ctx.getParameter(ext.GPU_DISJOINT_EXT);
      while (pending.length) {
        const { q, t } = pending[0];
        if (!ctx.getQueryParameter(q, ctx.QUERY_RESULT_AVAILABLE)) break;
        const ns = ctx.getQueryParameter(q, ctx.QUERY_RESULT) as number;
        ctx.deleteQuery(q);
        pending.shift();
        if (!disjoint) gpu.push({ t, ms: ns / 1e6 });
      }
    };

    const unsubBefore = addEffect((now) => {
      frameStart = performance.now();
      renderStart = 0;
      if (lastStart) {
        samples.push({
          t: now,
          interval: now - lastStart,
          cpu: NaN,
          render: NaN,
        });
      }
      lastStart = now;
      gl.info.reset();
      pollQueries();
      if (ext && !active && pending.length < 8) {
        const q = ctx.createQuery();
        try {
          ctx.beginQuery(ext.TIME_ELAPSED_EXT, q);
          active = q;
        } catch {
          queryError = true;
          ctx.deleteQuery(q);
        }
      }
    });

    const unsubAfter = addAfterEffect((now) => {
      if (active && ext) {
        ctx.endQuery(ext.TIME_ELAPSED_EXT);
        pending.push({ q: active, t: now });
        active = null;
      }
      const last = samples[samples.length - 1];
      if (last) {
        const end = performance.now();
        last.cpu = end - frameStart;
        if (renderStart) last.render = end - renderStart;
      }
      info = {
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
      };
    });

    // ---- 전력 브리지 (터미널의 powermetrics 값을 SSE로 받음) ----
    let power: Power | null = null;
    let mem: Mem | null = null;
    const es = new EventSource(POWER_URL);
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === "mem") mem = d;
        else power = d;
      } catch {
        /* ignore */
      }
    };

    // ---- HUD ----
    const hud = document.createElement("pre");
    hud.style.cssText = [
      "position:fixed",
      "left:8px",
      "top:8px",
      "z-index:10000003",
      "margin:0",
      "padding:10px 12px",
      "background:rgba(10,10,12,0.82)",
      "color:#e8e8e8",
      "font:12px/1.5 ui-monospace,Menlo,monospace",
      "border-radius:8px",
      "pointer-events:none",
      "white-space:pre",
    ].join(";");
    document.body.appendChild(hud);

    const timer = window.setInterval(() => {
      const cut = performance.now() - WINDOW_MS;
      samples = samples.filter((s) => s.t >= cut);
      gpu = gpu.filter((s) => s.t >= cut);

      const intervals = samples.map((s) => s.interval);
      const cpus = samples.map((s) => s.cpu).filter((x) => !Number.isNaN(x));
      const renders = samples
        .map((s) => s.render)
        .filter((x) => !Number.isNaN(x));
      const useFrames = samples
        .filter((s) => !Number.isNaN(s.cpu) && !Number.isNaN(s.render))
        .map((s) => s.cpu - s.render);
      const gpus = gpu.map((s) => s.ms);
      const mean = (xs: number[]) =>
        xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
      const fps = samples.length / (WINDOW_MS / 1000);
      const gpuMed = median(gpus);

      const canvas = gl.domElement;
      const mp = (canvas.width * canvas.height) / 1e6;
      const powerAge = power ? (Date.now() - power.t) / 1000 : Infinity;
      const p = powerAge < 3 ? power : null;
      const cycles = p && !Number.isNaN(gpuMed) ? (gpuMed * p.mhz) / 1000 : NaN;
      // 프레임당 에너지: 전력(mW = mJ/s) ÷ 초당 프레임. FPS가 다른 상황끼리 비교할 수 있다.
      // GPU 전력은 시스템 전체 값이라 브라우저 합성 등도 포함되고, 기준선을 빼지 않은 값이다.
      const mjPerFrame = p && p.gpuMw != null && fps > 0 ? p.gpuMw / fps : NaN;
      const vr = getVram(ctx);
      const m = mem && Date.now() - mem.t < 3000 ? mem : null;
      const mb = (b: number) => f(b / 1024 / 1024, 1);

      hud.textContent = [
        `FPS          ${f(fps, 0)}`,
        `프레임 간격  ${f(median(intervals))} ms   p95 ${f(pct(intervals, 0.95))}`,
        `CPU          ${f(median(cpus))} ms   p95 ${f(pct(cpus, 0.95))}`,
        `  useFrame   ${f(median(useFrames))} ms   렌더 제출 ${f(median(renders))} ms`,
        !ext
          ? `GPU          ${gpuTimer ? "미지원" : "끔 (다른 도구가 타이머 사용 중)"}`
          : `GPU          ${f(gpuMed)} ms   평균 ${f(mean(gpus))}   p95 ${f(pct(gpus, 0.95))}${queryError ? "  (쿼리 충돌)" : ""}`,
        ``,
        `드로우콜     ${info.calls}`,
        `삼각형       ${info.triangles.toLocaleString()}`,
        `프로그램     ${gl.info.programs?.length ?? "–"}`,
        `텍스처       ${gl.info.memory.textures}   지오메트리 ${gl.info.memory.geometries}`,
        `해상도       ${canvas.width}×${canvas.height} (${f(mp)} MP, DPR ${f(gl.getPixelRatio(), 2)})`,
        vr
          ? [
              `GPU 메모리   ${mb(vr.textures + vr.renderTargets + vr.buffers + vr.canvas)} MB (추정)${vr.unknownFormat ? "  *모르는 포맷 있음" : ""}`,
              `  텍스처     ${mb(vr.textures)}   렌더 타깃 ${mb(vr.renderTargets)}`,
              `  버퍼       ${mb(vr.buffers)}   캔버스 ${mb(vr.canvas)}`,
            ].join("\n")
          : `GPU 메모리   추적 안 됨 (새로고침 필요)`,
        m
          ? `  OS 실측    그래픽 ${mb(m.graphics)}   IOSurface ${mb(m.iosurface)}  (Chrome GPU 프로세스 전체)`
          : `  OS 실측    브리지 연결 안 됨`,
        ``,
        p
          ? [
              `GPU 클럭     ${f(p.mhz, 0)} MHz   활성 ${f(p.active * 100, 0)}%`,
              `GPU 전력     ${f(p.gpuMw, 0)} mW`,
              `CPU 전력     ${p.cpuMw == null ? "–" : f(p.cpuMw, 0)} mW`,
              `GPU 사이클   ${f(cycles)} M/프레임`,
              `프레임당     ${f(mjPerFrame)} mJ   (${f(mjPerFrame / mp, 2)} mJ/MP)`,
              `열 상태      ${p.thermal}`,
            ].join("\n")
          : `전력 브리지  연결 안 됨 (README의 power-bridge 참고)`,
      ].join("\n");
    }, 500);

    return () => {
      unsubBefore();
      unsubAfter();
      window.clearInterval(timer);
      es.close();
      hud.remove();
      gl.info.autoReset = prevAutoReset;
      scene.onBeforeRender = prevSceneBefore;
      if (active && ext) ctx.endQuery(ext.TIME_ELAPSED_EXT);
      pending.forEach(({ q }) => ctx.deleteQuery(q));
    };
  }, [gl, scene, gpuTimer]);

  return null;
}
