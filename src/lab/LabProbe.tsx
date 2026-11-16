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
  maxMhz?: number; // GPU 최대 클럭 (브리지가 클럭 단계 목록에서 구함. 이전 브리지는 보내지 않음)
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
  x == null || !Number.isFinite(x) ? "–" : x.toFixed(d);

export default function LabProbe({ gpuTimer = true }: { gpuTimer?: boolean }) {
  // eslint는 훅이 돌려준 값의 수정을 막지만, renderer 설정을 바꾸는 것이 이 컴포넌트의 목적이다.
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const get = useThree((s) => s.get);

  useEffect(() => {
    const ctx = gl.getContext() as WebGL2RenderingContext;
    // 콘솔에서 렌더러를 직접 확인할 수 있게 실험실에서만 노출한다 (예: __labGl.getContext().getContextAttributes())
    (window as unknown as { __labGl?: unknown }).__labGl = gl;
    // 카메라 조작도 노출한다. 움직이는 동안의 비용을 잴 때 자동 회전을 켠다
    // (예: __labThree().controls.autoRotate = true)
    (window as unknown as { __labThree?: unknown }).__labThree = get;
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
      wall: number; // Date.now(). 브리지 샘플(1초 구간)과 같은 시계로 프레임 수를 세기 위함
      interval: number;
      cpu: number;
      render: number;
    };
    let samples: Sample[] = [];
    let cur: Sample | null = null; // 이번 프레임의 기록 (판정에서 뺀 프레임이면 null)
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
      // 렌더를 멈췄다 다시 시작한 첫 프레임(기준선 측정, 가려진 동안 멈춤, 탭 전환)은
      // 끊김이 아니므로 판정에서 뺀다
      cur = null;
      if (lastStart && now - lastStart < 1000) {
        cur = {
          t: now,
          wall: Date.now(),
          interval: now - lastStart,
          cpu: NaN,
          render: NaN,
        };
        samples.push(cur);
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
      const last = cur;
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

    // ---- 판정 기준: 목표 프레임 시간 (화면 주사율). 지금까지 본 가장 짧은 간격에 맞춘다 ----
    const RATES = [60, 75, 90, 100, 120, 144, 165, 240];
    let targetMs = Infinity;
    const DROP_GOAL = 1; // 목표 드랍률 (%)
    const GATE_MS = 10_000; // 드랍률은 10초 동안 본다 (1초에 60장이라 1%를 보려면 길어야 한다)
    let peakVram = 0;

    const timer = window.setInterval(() => {
      const nowPerf = performance.now();
      samples = samples.filter((s) => s.t >= nowPerf - GATE_MS);
      gpu = gpu.filter((s) => s.t >= nowPerf - WINDOW_MS);
      const recent = samples.filter((s) => s.t >= nowPerf - WINDOW_MS);

      const intervals = recent.map((s) => s.interval);
      const cpus = recent.map((s) => s.cpu).filter((x) => !Number.isNaN(x));
      const renders = recent
        .map((s) => s.render)
        .filter((x) => !Number.isNaN(x));
      const useFrames = recent
        .filter((s) => !Number.isNaN(s.cpu) && !Number.isNaN(s.render))
        .map((s) => s.cpu - s.render);
      const fps = recent.length / (WINDOW_MS / 1000);
      const gpuMed = median(gpu.map((s) => s.ms));

      // 목표 프레임 시간: 1초 중앙값을 가까운 주사율로 맞추고, 가장 짧았던 값을 유지한다
      if (recent.length >= 30) {
        const med = median(intervals);
        const snapped = RATES.map((r) => 1000 / r).reduce((a, b) =>
          Math.abs(b - med) < Math.abs(a - med) ? b : a,
        );
        targetMs = Math.min(targetMs, snapped);
      }
      const targetFps = Number.isFinite(targetMs) ? 1000 / targetMs : NaN;
      // 드랍 = vsync를 한 번 이상 놓친 프레임 (간격이 목표의 1.5배를 넘음)
      const drops = Number.isFinite(targetMs)
        ? samples.filter((s) => s.interval > targetMs * 1.5).length
        : 0;
      // 분모는 기준 FPS로 10초 동안 그렸어야 할 장수 (60fps면 600장)
      const expected = Number.isFinite(targetMs)
        ? Math.round(GATE_MS / targetMs)
        : NaN;
      const dropPct = expected > 0 ? (drops / expected) * 100 : NaN;

      const powerAge = power ? (Date.now() - power.t) / 1000 : Infinity;
      const p = powerAge < 3 ? power : null;
      // 브리지 샘플(직전 1초)과 같은 구간에 실제로 그린 프레임 수
      const fpsP = p
        ? samples.filter((s) => s.wall > p.t - 1000 && s.wall <= p.t).length
        : NaN;
      // GPU 사이클/프레임 = 활성 비율 × 클럭 ÷ 그린 프레임 수 (M). 클럭 변화를 지운 GPU 작업량.
      // 활성 비율은 GPU 전체 값이라 브라우저 합성처럼 WebGL 밖의 일도 들어간다
      const cycles = p && fpsP > 0 ? (p.active * p.mhz) / fpsP : NaN;
      // GPU 필요 시간 = 사이클 ÷ 최대 클럭 × 1000 (ms). 이 장면을 GPU가 최대 속도로 그리면 걸릴 시간.
      // FPS가 방어될 때는 마감까지의 여유를, GPU 한계일 때는(클럭이 최대) 실제 일한 시간과 같은 값을 보여 준다
      const needMs = p?.maxMhz && Number.isFinite(cycles) ? (cycles / p.maxMhz) * 1000 : NaN;
      // GPU 예산 점유율 = GPU 필요 시간 ÷ 마감. 100% 미만이면 여유, 넘으면 이미 FPS를 못 지키는 상태
      const budgetPct = Number.isFinite(targetMs) ? (needMs / targetMs) * 100 : NaN;
      // GPU가 실제로 일한 시간/프레임. WebGL 타이머는 렌더 타깃을 여러 번 쓰면 대기가 섞여 부풀려진다
      const busyMs = p && fpsP > 0 ? (p.active * 1000) / fpsP : NaN;
      const total = p ? (p.gpuMw ?? 0) + (p.cpuMw ?? 0) : NaN;

      const canvas = gl.domElement;
      const mp = (canvas.width * canvas.height) / 1e6;
      const vr = getVram(ctx);
      const vrTotal = vr
        ? vr.textures + vr.renderTargets + vr.buffers + vr.canvas
        : 0;
      peakVram = Math.max(peakVram, vrTotal);
      const m = mem && Date.now() - mem.t < 3000 ? mem : null;
      const mb = (b: number) => f(b / 1024 / 1024, 1);

      const head = (t: string) =>
        `<span style="display:inline-block;margin-top:6px;font-size:10px;letter-spacing:0.08em;color:#8a93a6">${t}</span>`;
      const big = (label: string, value: string, color = "#ffffff") =>
        `<span style="font-size:15px;font-weight:700;color:${color}">${label}${value}</span>`;
      const dim = (t: string) => `<span style="color:#9aa3b2">${t}</span>`;
      const ok = (good: boolean) => (good ? "#7bd88f" : "#ff6b6b");
      const thermalColor = (t: string) =>
        /nominal/i.test(t)
          ? "#7bd88f"
          : /fair|moderate/i.test(t)
            ? "#f0c674"
            : /serious|heavy/i.test(t)
              ? "#ff9f5a"
              : "#ff6b6b";
      const noBridge = dim("브리지 연결 안 됨");
      const cpuMed = median(cpus);

      hud.innerHTML = [
        head("성능"),
        p
          ? big("GPU 예산 점유율 ", `${f(budgetPct, 0)}%`, "#ffd479") +
            dim(
              p.maxMhz
                ? `  최대 ${f(p.maxMhz, 0)} MHz 기준 ${f(needMs)} / ${f(targetMs)} ms · 사이클 ${f(cycles)} M (활성 ${f(p.active * 100, 0)}% × ${f(p.mhz, 0)} MHz ÷ ${fpsP} fps)`
                : `  최대 클럭 모름 (브리지 재시작 필요) · 사이클 ${f(cycles)} M`,
            )
          : big("GPU 예산 점유율 ", "–", "#9aa3b2") + "  " + noBridge,
        big(
          "프레임 드랍률 ",
          `${f(dropPct, 1)}%`,
          Number.isNaN(dropPct) ? "#9aa3b2" : ok(dropPct < DROP_GOAL),
        ) +
          dim(
            `  ${drops}/${f(expected, 0)}장 (${f(targetFps, 0)}fps 기준 ${GATE_MS / 1000}초)`,
          ),
        "",
        `FPS         ${f(fps, 0)} / ${f(targetFps, 0)}` +
          dim(`   프레임 간격 p95 ${f(pct(intervals, 0.95))} ms`),
        !ext
          ? `GPU time    ${gpuTimer ? "미지원" : "끔 (다른 도구가 타이머 사용 중)"}`
          : `GPU time    ${f(gpuMed)} / ${f(targetMs)} ms` +
            dim(
              p
                ? `   실제 일한 시간 ${f(busyMs)} ms · 클럭 ${f(p.mhz, 0)} / ${p.maxMhz ? f(p.maxMhz, 0) : "–"} MHz`
                : "",
            ) +
            dim(queryError ? "  (쿼리 충돌)" : ""),
        `CPU time    ${f(cpuMed)} / ${f(targetMs)} ms`,
        `  useFrame  ${f(median(useFrames))} ms`,
        `  렌더 제출 ${f(median(renders))} ms`,
        head("발열 · 메모리"),
        p
          ? `열 상태     <span style="color:${thermalColor(p.thermal)}">${p.thermal}</span>`
          : `열 상태     ${noBridge}`,
        p
          ? `총 전력     ${f(total, 0)} mW` + dim(`  (CPU + GPU)`)
          : `총 전력     ${noBridge}`,
        p ? `  GPU 전력  ${f(p.gpuMw, 0)} mW` : "",
        p ? `  CPU 전력  ${p.cpuMw == null ? "–" : f(p.cpuMw, 0)} mW` : "",
        vr
          ? `GPU 메모리  ${mb(vrTotal)} MB (추정)` +
            dim(`  최대 ${mb(peakVram)}${vr.unknownFormat ? "  *모르는 포맷 있음" : ""}`)
          : `GPU 메모리  추적 안 됨 (새로고침 필요)`,
        vr
          ? `  렌더 타깃 ${mb(vr.renderTargets)}  텍스처 ${mb(vr.textures)}  버퍼 ${mb(vr.buffers)}  캔버스 ${mb(vr.canvas)}`
          : "",
        m
          ? dim(`  OS 실측   그래픽 ${mb(m.graphics)}  IOSurface ${mb(m.iosurface)}`)
          : "",
        head("원인 지표"),
        `해상도      ${canvas.width}×${canvas.height}  DPR ${f(gl.getPixelRatio(), 2)}  ${f(mp)} MP`,
        `드로우콜    ${info.calls}`,
        `삼각형      ${info.triangles.toLocaleString()}`,
        `프로그램    ${gl.info.programs?.length ?? "–"}`,
        `텍스처      ${gl.info.memory.textures}`,
        `지오메트리  ${gl.info.memory.geometries}`,
      ]
        .filter((line, i, all) => line !== "" || all[i - 1]?.includes("프레임 드랍"))
        .join("\n");
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
  }, [gl, scene, gpuTimer, get]);

  return null;
}
