// 1) powermetrics의 plist 출력을 표준 입력으로 받아 1초마다 GPU 클럭과 전력을 SSE로 내보낸다.
// 2) 1초마다 Chrome GPU 프로세스의 메모리를 footprint로 읽어 함께 내보낸다 (sudo 불필요).
// 관리자 권한은 powermetrics에만 쓰고, 이 스크립트는 일반 사용자로 실행한다.
//
//   sudo powermetrics --samplers gpu_power,cpu_power,thermal -i 1000 -f plist \
//     | node scripts/power-bridge.mjs
//
// 메모리만 볼 때는 파이프 없이 `node scripts/power-bridge.mjs`로 실행한다.
// 브라우저(?lab)의 HUD가 http://127.0.0.1:7071/power 를 구독한다.

import { execFile } from "node:child_process";
import http from "node:http";

const PORT = Number(process.env.PORT ?? 7071);
const clients = new Set();
let latest = null; // 마지막 전력 샘플
let latestMem = null; // 마지막 메모리 샘플

const broadcast = (obj) => {
  const line = `data: ${JSON.stringify(obj)}\n\n`;
  for (const res of clients) res.write(line);
};

// ---- 최소 plist(XML) 파서: dict, array, key, string, integer, real, date, true, false ----
function parsePlist(xml) {
  const re =
    /<(\/?)(dict|array|key|string|integer|real|date|true|false|data)(\s*\/)?>/g;
  const stack = [];
  const keys = [];
  let root;
  let key = null;
  let m;
  const put = (val) => {
    const top = stack[stack.length - 1];
    if (!top) root = val;
    else if (Array.isArray(top)) top.push(val);
    else {
      top[key] = val;
      key = null;
    }
  };
  while ((m = re.exec(xml))) {
    const [, close, tag, selfClose] = m;
    if (tag === "dict" || tag === "array") {
      if (close) {
        const v = stack.pop();
        key = keys.pop(); // 이 컨테이너를 열기 직전의 키로 되돌린다
        put(v);
      } else if (selfClose) put(tag === "dict" ? {} : []);
      else {
        keys.push(key);
        key = null;
        stack.push(tag === "dict" ? {} : []);
      }
      continue;
    }
    if (tag === "true" || tag === "false") {
      put(tag === "true");
      continue;
    }
    if (close) continue;
    const end = xml.indexOf(`</${tag}>`, re.lastIndex);
    const text = xml.slice(re.lastIndex, end);
    re.lastIndex = end + tag.length + 3;
    if (tag === "key") key = text;
    else if (tag === "integer" || tag === "real") put(Number(text));
    else put(text);
  }
  return root;
}

function summarize(s) {
  const el = s.elapsed_ns / 1e9;
  const g = s.gpu ?? {};
  const busy = (g.dvfm_states ?? []).filter((d) => d.used_ns > 0);
  const tot = busy.reduce((a, d) => a + d.used_ns, 0);
  const mhz = tot ? busy.reduce((a, d) => a + d.freq * d.used_ns, 0) / tot : 0;
  const p = s.processor ?? {};
  const cpuMw =
    typeof p.cpu_power === "number"
      ? p.cpu_power
      : typeof p.cpu_energy === "number"
        ? p.cpu_energy / el
        : null;
  // 이 GPU가 낼 수 있는 최대 클럭 (클럭 단계 목록 중 가장 높은 값). 한계에 가까운지 판단할 때 쓴다
  const maxMhz = Math.max(0, ...(g.dvfm_states ?? []).map((d) => d.freq));
  return {
    type: "power",
    mhz,
    maxMhz,
    gpuMw: typeof g.gpu_energy === "number" ? g.gpu_energy / el : null,
    cpuMw,
    active: 1 - (g.idle_ratio ?? 1),
    thermal: s.thermal_pressure ?? "?",
    t: Date.now(),
  };
}

// ---- Chrome GPU 프로세스 메모리 (footprint) ----
// Chrome은 모든 탭의 GPU 작업을 GPU 프로세스 하나가 처리한다. 다른 탭과 브라우저 UI도
// 섞인 값이므로 절대값보다 토글 전후의 변화량을 본다.
// Electron 앱(Obsidian 등)도 --type=gpu-process를 쓰므로 Chrome 경로로 거른다.
let gpuPid = null;
const sh = (cmd, args) =>
  new Promise((resolve, reject) =>
    execFile(cmd, args, { maxBuffer: 4 << 20 }, (err, out) =>
      err ? reject(err) : resolve(out),
    ),
  );

async function findGpuPid() {
  const out = await sh("ps", ["-axo", "pid=,command="]);
  const line = out
    .split("\n")
    .find((l) => /Google Chrome\.app\/.*--type=gpu-process/.test(l));
  return line ? Number(line.trim().split(/\s+/)[0]) : null;
}

// footprint -f bytes 한 줄: "<dirty> B  <clean> B  <reclaimable> B  <regions>  <category>"
function category(out, name) {
  const line = out.split("\n").find((l) => l.trimEnd().endsWith(name));
  if (!line) return 0;
  return Number(line.trim().split(/\s+/)[0]);
}

async function sampleMem() {
  try {
    gpuPid ??= await findGpuPid();
    if (!gpuPid) return;
    const out = await sh("footprint", ["-p", String(gpuPid), "-f", "bytes"]);
    const total = Number(out.match(/Footprint:\s+(\d+)\s+B/)?.[1] ?? 0);
    latestMem = {
      type: "mem",
      pid: gpuPid,
      graphics: category(out, "IOAccelerator (graphics)"),
      iosurface: category(out, "IOSurface"),
      total,
      t: Date.now(),
    };
    broadcast(latestMem);
    if (!piped) {
      const mb = (b) => (b / 1048576).toFixed(0).padStart(5);
      console.log(
        `Chrome GPU(pid ${gpuPid})  그래픽 ${mb(latestMem.graphics)} MB  IOSurface ${mb(latestMem.iosurface)} MB  (구독 ${clients.size})`,
      );
    }
  } catch {
    gpuPid = null; // Chrome 재시작 등으로 프로세스가 바뀌면 다음 번에 다시 찾는다
  }
}
setInterval(sampleMem, 1000);

// ---- 표준 입력: 샘플마다 NUL(\0)로 구분된다 ----
let piped = !process.stdin.isTTY;
let buf = "";
if (piped) process.stdin.setEncoding("utf8");
if (!piped)
  console.log("powermetrics 입력 없음: GPU 프로세스 메모리만 내보냅니다.");
if (piped)
  process.stdin.on("data", (chunk) => {
    buf += chunk;
    let i;
    while ((i = buf.indexOf("\0")) >= 0) {
      const doc = buf.slice(0, i);
      buf = buf.slice(i + 1);
      if (!doc.trim()) continue;
      try {
        latest = summarize(parsePlist(doc));
      } catch (e) {
        console.error("파싱 실패:", e.message);
        continue;
      }
      broadcast(latest);
      const memMb = latestMem
        ? `  GPU 프로세스 그래픽 ${(latestMem.graphics / 1048576).toFixed(0)} MB`
        : "";
      console.log(
        `GPU ${latest.mhz.toFixed(0).padStart(4)} MHz  ${String(latest.gpuMw?.toFixed(0)).padStart(5)} mW  ` +
          `활성 ${(latest.active * 100).toFixed(0).padStart(3)}%  CPU ${latest.cpuMw == null ? "–" : latest.cpuMw.toFixed(0)} mW  ` +
          `${latest.thermal}${memMb}  (구독 ${clients.size})`,
      );
    }
  });
if (piped)
  process.stdin.on("end", () => {
    // 전력 입력이 끊겨도 메모리 측정은 계속한다.
    console.log("powermetrics 입력이 끝났습니다. 메모리만 계속 내보냅니다.");
    piped = false;
  });

http
  .createServer((req, res) => {
    if (!req.url?.startsWith("/power")) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    if (latest) res.write(`data: ${JSON.stringify(latest)}\n\n`);
    if (latestMem) res.write(`data: ${JSON.stringify(latestMem)}\n\n`);
    clients.add(res);
    req.on("close", () => clients.delete(res));
  })
  .listen(PORT, "127.0.0.1", () =>
    console.log(
      `전력 브리지: http://127.0.0.1:${PORT}/power (powermetrics 입력 대기 중)`,
    ),
  );
