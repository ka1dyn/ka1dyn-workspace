// powermetrics의 plist 출력을 표준 입력으로 받아 1초마다 GPU 클럭과 전력을 SSE로 내보낸다.
// 관리자 권한은 powermetrics에만 쓰고, 이 스크립트는 일반 사용자로 실행한다.
//
//   sudo powermetrics --samplers gpu_power,cpu_power,thermal -i 1000 -f plist \
//     | node scripts/power-bridge.mjs
//
// 브라우저(?lab)의 HUD가 http://127.0.0.1:7071/power 를 구독한다.

import http from "node:http";

const PORT = 7071;
const clients = new Set();
let latest = null;

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
  return {
    mhz,
    gpuMw: typeof g.gpu_energy === "number" ? g.gpu_energy / el : null,
    cpuMw,
    active: 1 - (g.idle_ratio ?? 1),
    thermal: s.thermal_pressure ?? "?",
    t: Date.now(),
  };
}

// ---- 표준 입력: 샘플마다 NUL(\0)로 구분된다 ----
let buf = "";
process.stdin.setEncoding("utf8");
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
    const line = `data: ${JSON.stringify(latest)}\n\n`;
    for (const res of clients) res.write(line);
    console.log(
      `GPU ${latest.mhz.toFixed(0).padStart(4)} MHz  ${String(latest.gpuMw?.toFixed(0)).padStart(5)} mW  ` +
        `활성 ${(latest.active * 100).toFixed(0).padStart(3)}%  CPU ${latest.cpuMw == null ? "–" : latest.cpuMw.toFixed(0)} mW  ` +
        `${latest.thermal}  (구독 ${clients.size})`,
    );
  }
});
process.stdin.on("end", () => {
  console.log("powermetrics 입력이 끝났습니다.");
  process.exit(0);
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
    clients.add(res);
    req.on("close", () => clients.delete(res));
  })
  .listen(PORT, "127.0.0.1", () =>
    console.log(
      `전력 브리지: http://127.0.0.1:${PORT}/power (powermetrics 입력 대기 중)`,
    ),
  );
