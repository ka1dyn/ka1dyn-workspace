import * as THREE from "three";

// 시드 고정 바람 노이즈. 매 픽셀 FBM을 계산하지 않도록 시작할 때 한 번 텍스처로 굽는다.
// 잔디 바람, 수면 잔물결이 함께 쓴다.

// 정수 격자점 해시 → [0, 1). period로 감싸서 타일링되게 한다.
function hash(x: number, y: number, period: number, seed: number) {
  x = ((x % period) + period) % period;
  y = ((y % period) + period) % period;
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number, period: number, seed: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy, period, seed);
  const b = hash(ix + 1, iy, period, seed);
  const c = hash(ix, iy + 1, period, seed);
  const d = hash(ix + 1, iy + 1, period, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

// 4옥타브 FBM, 결과는 대략 [0, 1]
function fbm(x: number, y: number, period: number, seed: number) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let o = 0; o < 4; o++) {
    sum += valueNoise(x, y, period, seed + o) * amp;
    norm += amp;
    x *= 2;
    y *= 2;
    period *= 2;
    amp *= 0.5;
  }
  return sum / norm;
}

// ---- 바람 노이즈: 256² RGBA, 타일링, 채널마다 다른 시드 ----
const WIND_SIZE = 256;
function createWindTexture() {
  const data = new Uint8Array(WIND_SIZE * WIND_SIZE * 4);
  const cells = 8; // 텍스처 한 장에 노이즈 격자 8칸
  for (let y = 0; y < WIND_SIZE; y++) {
    for (let x = 0; x < WIND_SIZE; x++) {
      const u = (x / WIND_SIZE) * cells;
      const v = (y / WIND_SIZE) * cells;
      const i = (y * WIND_SIZE + x) * 4;
      for (let c = 0; c < 4; c++)
        data[i + c] = fbm(u, v, cells, 11 + c * 7) * 255;
    }
  }
  const tex = new THREE.DataTexture(data, WIND_SIZE, WIND_SIZE);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// 잔디 키 군락용 월드 공간 노이즈 [0, 1] (CPU)
export function clumpNoise(x: number, z: number) {
  return fbm(x * 0.35 + 100, z * 0.35 + 100, 1e9, 29);
}

let windTex: THREE.DataTexture | null = null;

export function getWindTexture() {
  return (windTex ??= createWindTexture());
}
