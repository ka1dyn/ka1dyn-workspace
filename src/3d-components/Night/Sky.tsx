import { useLab } from "@/lab/store";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MOON_DIR, setMoonDir } from "./constants";
import { bakeMilkyWay } from "./milkyway";

// 하늘 돔: 조명 계산 없이 방향만으로 색을 정한다.
// 세로 그라데이션 + 은하수 + 별 + 달 + 지평선 숲 실루엣.
// 하늘은 화면의 큰 부분을 덮고 물웅덩이 반사에서도 한 번 더 그려지므로,
// 무거운 노이즈(은하수)는 시작할 때 한 번 굽고(milkyway.ts) 여기서는 텍스처 1번만 읽는다.
// SKY_OLD를 정의하면 이전 하늘(칸 전체를 칠하는 별, 값 노이즈 숲)로 그린다 (비교·측정용).

// 은하수 띠(대원)의 평면 법선. 띠의 가장 높은 곳이 방위 16°(atan2(z, x) 기준), 고도 65°에 오도록 기울였다.
// 전체 장면 첫 화면(카메라 방위 65.7°)에서는 오른쪽 끝에 걸치고, 달(방위 -143°, 고도 18°)과는
// 약 70° 떨어진다. 대부분은 카메라를 돌려야 보인다.
const MILKY_NORMAL = new THREE.Vector3(0.8712, -0.4226, 0.2498);

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww; // 항상 가장 먼 깊이에 그린다
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uMoonDir;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uTree;
  uniform vec3 uMoon;
  uniform float uTime;
  uniform sampler2D uMilkyTex;
  uniform float uMilky;       // 은하수 세기
  uniform float uMilkyRot;    // 은하수 방위 회전 (라디안)
  uniform float uStarDensity;
  uniform float uStarBright;
  uniform float uTwinkle;
  uniform float uTreeLayers;  // 숲 겹 수 (1~3)
  uniform float uTreeHeight;  // 숲 높이 배율
  uniform float uReflect;     // 물웅덩이 반사 카메라로 그릴 때 1 (별을 건너뛴다)
  uniform vec3 uMeteorHead[4]; // 별똥별 머리 방향 (동시에 최대 4개)
  uniform vec3 uMeteorTail[4]; // 별똥별 꼬리 끝 방향
  uniform vec4 uMeteorAlpha;   // 별똥별마다 밝기 (모두 0이면 아래 계산을 통째로 건너뛴다)
  varying vec3 vDir;

  // ---- 해시 / 노이즈 ----
  float hash11(float n) { return fract(sin(n) * 43758.5453); }
  vec3 hash33(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
  }
  vec3 hash31(float n) {
    return fract(sin(vec3(n, n + 1.7, n + 3.3)) * vec3(43758.5453, 22578.1459, 19642.3490));
  }
  float noise1(float x) {
    float i = floor(x);
    float f = fract(x);
    return mix(hash11(i), hash11(i + 1.0), f * f * (3.0 - 2.0 * f));
  }
  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash33(i).x, b = hash33(i + vec3(1, 0, 0)).x;
    float c = hash33(i + vec3(0, 1, 0)).x, e = hash33(i + vec3(1, 1, 0)).x;
    float g = hash33(i + vec3(0, 0, 1)).x, k = hash33(i + vec3(1, 0, 1)).x;
    float l = hash33(i + vec3(0, 1, 1)).x, m = hash33(i + vec3(1, 1, 1)).x;
    return mix(mix(mix(a, b, f.x), mix(c, e, f.x), f.y), mix(mix(g, k, f.x), mix(l, m, f.x), f.y), f.z);
  }

  // ---- 별 한 층 ----
  // 방향을 3D 격자 칸으로 나누고, 칸마다 많아야 별 하나를 칸 안의 랜덤 위치에 둔다.
  // 칸 전체가 아니라 그 점까지의 거리로 둥근 점을 그린다. 별이 칸 경계에 잘리지 않도록
  // 구면에 투영한 별 위치가 칸 안쪽(가장자리 여유)에 있을 때만 그린다.
  vec3 starLayer(vec3 d, float scale, float prob, float sizeMul, float pixAng, float seed) {
    vec3 p = d * scale;
    vec3 cell = floor(p);
    vec3 h = hash33(cell + seed);
    if (h.x > prob) return vec3(0.0);
    vec3 j = hash33(cell + seed + 17.0);
    vec3 sp = normalize(cell + 0.2 + 0.6 * j) * scale; // 구면 위의 별 위치 (칸 좌표)
    vec3 q = sp - cell;
    if (any(lessThan(q, vec3(0.25))) || any(greaterThan(q, vec3(0.75)))) return vec3(0.0);
    // 별은 자기 칸 안에서만 계산되므로, 크기와 번짐이 칸 가장자리 여유(0.25칸) 안에서
    // 0이 되어야 한다. 넘치면 번짐이 칸 경계에서 잘려 사각형으로 보인다.
    float maxR = 0.22 / scale;

    float dist = length(p - sp) / scale;          // 각거리 (라디안 근사)
    float mag = pow(h.y, 5.0);                     // 등급: 대부분 희미, 소수만 밝게
    float radius = (0.00045 + 0.0011 * mag) * sizeMul;
    // 1픽셀보다 작게 그리면 지글거리므로 크기는 픽셀만큼 키우고 그만큼 밝기를 나눈다
    float r = min(max(radius, pixAng * 0.75), maxR * 0.5);
    float energy = (radius * radius) / (r * r);
    float core = exp(-dist * dist / (r * r) * 2.5) * energy;
    float g = 1.0 - smoothstep(0.0, maxR, dist);
    float glow = g * g * mag * 0.12;

    // 반짝임이 1을 넘으면 잠깐 완전히 꺼졌다 켜진다 (음수 밝기는 0으로 막는다)
    float tw = max(0.0, 1.0 + uTwinkle * sin(uTime * (1.3 + h.z * 3.0) + h.y * 40.0));
    vec3 tint = mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.9, 0.74), h.z);
    tint = mix(tint, vec3(1.0), 0.4);
    return tint * (core + glow) * (0.35 + 2.2 * mag) * tw;
  }

  // ---- 침엽수 숲 한 겹: 방위각 칸마다 나무 한 그루 ----
  // 나무 윤곽 = 뾰족한 삼각형에서 가지 층만큼 톱니를 뺀 모양. 좌우 이웃 칸까지 봐서 나무가 겹친다.
  float treeLine(float az, float perRad, float baseH, float varH, float seed) {
    float x = az * perRad;
    float id = floor(x);
    float top = -1.0;
    for (int k = -1; k <= 1; k++) {
      float cid = id + float(k);
      vec3 r = hash31(cid * 7.13 + seed);
      float cx = cid + 0.5 + (r.x - 0.5) * 0.7;
      float height = (baseH + varH * r.y) * uTreeHeight;
      float halfW = 0.45 + 0.35 * r.z;           // 밑동 반폭 (칸 단위)
      float t = 1.0 - abs(x - cx) / halfW;        // 중심 1 → 가장자리 0
      if (t <= 0.0) continue;
      float tiers = fract(t * (4.0 + r.x * 3.0) + r.y);
      float sil = height * (t - 0.09 * tiers);
      top = max(top, sil);
    }
    // 나무 사이 빈틈은 낮은 덤불선으로 메운다
    return max(top, baseH * 0.35 * uTreeHeight * (0.7 + 0.6 * noise1(x * 0.7 + seed)));
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 color = mix(uHorizon, uZenith, smoothstep(-0.05, 0.6, h));

  #ifdef SKY_OLD
    // 이전 하늘: 칸 전체를 칠하는 별 + 값 노이즈 숲
    vec3 cell = floor(d * 180.0);
    float star = step(0.9975, fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453));
    color += star * smoothstep(0.1, 0.5, h) * 0.6;
    float c = dot(d, uMoonDir);
    float disk = smoothstep(0.99955, 0.99975, c);
    float halo = pow(max(c, 0.0), 600.0) * 0.5 + pow(max(c, 0.0), 40.0) * 0.08;
    color += uMoon * (disk * 2.0 + halo);
    float az0 = atan(d.z, d.x);
    float tree0 = 0.035 + 0.05 * noise1(az0 * 18.0) + 0.03 * noise1(az0 * 55.0) + 0.02 * noise1(az0 * 140.0);
    color = mix(color, uTree, step(h, tree0));
  #else
    float c = dot(d, uMoonDir);
    // 달빛과 대기에 씻기는 정도: 달 가까이, 지평선 가까이에서 별·은하수를 약하게
    float moonWash = smoothstep(0.75, 0.97, c);
    float skyVis = smoothstep(0.0, 0.22, h) * (1.0 - 0.85 * moonWash);

    // 화면 미분(fwidth)은 픽셀마다 갈라지는 분기 안에서 정의되지 않으므로 분기 밖에서 먼저 구한다
    float pixAng = length(fwidth(d));
    float aa = fwidth(h) * 1.2 + 1e-5;

    // 별·은하수는 보이는 곳(지평선 위)에서만 계산한다
    if (skyVis > 0.001) {
    // 은하수: 미리 구운 텍스처 1번 읽기 (방위 회전은 읽을 때 적용)
    float cr = cos(uMilkyRot), sr = sin(uMilkyRot);
    vec3 md = vec3(cr * d.x - sr * d.z, d.y, sr * d.x + cr * d.z);
    vec2 muv = vec2(atan(md.z, md.x) / 6.2831853 + 0.5, asin(clamp(md.y, -1.0, 1.0)) / 3.1415927 + 0.5);
    vec4 milky = textureLod(uMilkyTex, muv, 0.0); // LOD 0: 경도 이음매에서 밉이 튀지 않게
    color += milky.rgb * 0.45 * uMilky * skyVis;

    // 별: 촘촘하고 희미한 층(은하수 띠 안에서 더 많이) + 성기고 밝은 층.
    // 반사에서는 물결로 흐려져 보이지 않으므로 계산하지 않는다
    if (uReflect < 0.5) {
    // (칸 안쪽 여유를 넓힌 만큼 별이 생길 확률을 올려 밀도를 맞춘다)
    vec3 stars = starLayer(d, 260.0, (0.2 + 0.6 * milky.a * uMilky) * uStarDensity, 0.6, pixAng, 3.1)
               + starLayer(d, 90.0, 0.4 * uStarDensity, 1.4, pixAng, 11.7);
    color += stars * 0.55 * uStarBright * skyVis;

    // 별똥별: 꼬리 끝→머리 선분, 최대 4개. 떠 있는 별똥별이 없을 때(uniform 모두 0)는 모든 픽셀이 건너뛰므로 비용이 거의 없다
    if (dot(uMeteorAlpha, vec4(1.0)) > 0.0) {
      for (int i = 0; i < 4; i++) {
        float a = uMeteorAlpha[i];
        if (a <= 0.0) continue;
        vec3 seg = uMeteorHead[i] - uMeteorTail[i];
        // 선분을 감싸는 구 밖의 픽셀은 바로 건너뛴다 (하늘 대부분이 여기서 끝나 별똥별이 떠 있어도 싸다)
        vec3 mid = d - (uMeteorHead[i] + uMeteorTail[i]) * 0.5;
        if (dot(mid, mid) > dot(seg, seg) * 0.25 + 1e-4) continue;
        // 하늘 표면을 따라 휜 호(대원)까지의 거리. 직선(현)으로 재면 가운데가 구 안쪽으로 떨어져 머리·꼬리 끝만 보인다
        vec3 hd = uMeteorHead[i], tl = uMeteorTail[i];
        vec3 nrm = cross(tl, hd);
        float nl = length(nrm);
        if (nl < 1e-6) continue; // 막 생겨 꼬리 길이가 0인 순간
        nrm /= nl;
        float total = atan(nl, dot(tl, hd));                             // 호 전체 각도
        float t = atan(dot(cross(tl, d), nrm), dot(tl, d)) / total;      // 0 꼬리 끝 → 1 머리
        float dist = t < 0.0 ? length(d - tl) : t > 1.0 ? length(d - hd) : abs(dot(d, nrm));
        t = clamp(t, 0.0, 1.0);
        // 날카롭게: 머리 쪽도 가늘고(약 1픽셀) 꼬리 끝으로 갈수록 바늘처럼 더 가늘어진다
        float w0 = 0.0007 * (0.15 + 0.85 * t * t);
        float w = max(w0, pixAng * 0.7);      // 1픽셀보다 가늘면 굵히고 그만큼 밝기를 나눈다
        float line = exp(-dist * dist / (w * w) * 3.0) * (w0 / w);
        float headGlow = exp(-pow(length(d - uMeteorHead[i]) / (w * 1.6), 2.0));
        color += vec3(0.9, 0.95, 1.0) * (line * pow(t, 1.5) * 2.2 + headGlow * 0.5) * a * skyVis;
      }
    }
    }
    }

    // 달: 원판(가장자리 어둡게 + 옅은 바다 무늬) + 두 겹 번짐
    float disk = smoothstep(0.99955, 0.99975, c);
    if (disk > 0.0) {
      vec3 local = (d - uMoonDir * c) / 0.0265; // 원판 안 좌표 (중심 0, 가장자리 약 1)
      float rr = clamp(dot(local, local), 0.0, 1.0);
      float limb = pow(1.0 - rr, 0.25);
      float maria = smoothstep(0.45, 0.75, vnoise(local * 2.2 + 5.0) * 0.65 + vnoise(local * 5.0 + 1.0) * 0.35);
      disk *= limb * (1.0 - 0.22 * maria);
    }
    float halo = pow(max(c, 0.0), 600.0) * 0.5 + pow(max(c, 0.0), 40.0) * 0.08;
    color += uMoon * (disk * 2.0 + halo);

    // 지평선 위 밤안개: 숲 윤곽 뒤를 살짝 밝혀 실루엣을 살린다
    color += uHorizon * 0.35 * exp(-max(h, 0.0) / 0.05);

    // 숲: 먼 겹(낮고 촘촘, 안개에 가까운 색) → 가까운 겹(높고 성기고 어두움)
    // 숲은 지평선 근처 좁은 띠(0 ~ 0.1 × 숲 높이 배율)에만 윤곽이 있다.
    // 지평선 아래는 모든 겹이 덮어 가장 가까운 숲 색뿐이므로 루프 없이 바로 칠한다.
    // (하늘 돔은 반투명 돌 지형 뒤에서도 그려져 GPU가 가려진 픽셀을 건너뛰지 못하므로,
    //  이걸 빼먹으면 화면 아래쪽 땅 영역 전체에서 숲 루프가 돈다)
    if (h < -aa) {
      color = uTree;
    } else if (h < 0.105 * uTreeHeight + aa) {
    float az = atan(d.z, d.x);
    vec3 farTree = mix(uTree, uHorizon, 0.55);
    vec3 midTree = mix(uTree, uHorizon, 0.25);
    if (uTreeLayers > 2.5) {
      float t0 = treeLine(az, 90.0, 0.028, 0.03, 101.0);
      color = mix(color, farTree, smoothstep(aa, -aa, h - t0));
    }
    if (uTreeLayers > 1.5) {
      float t1 = treeLine(az, 55.0, 0.035, 0.045, 202.0);
      color = mix(color, midTree, smoothstep(aa, -aa, h - t1));
    }
    float t2 = treeLine(az, 32.0, 0.03, 0.07, 303.0);
    color = mix(color, uTree, smoothstep(aa, -aa, h - t2));
    }
  #endif

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

const METEOR_SLOTS = [0, 1, 2, 3];

type MeteorSlot = {
  start: number;
  dur: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
};

/** 빈 칸에 별똥별 하나를 띄운다. 시작점은 지금 화면 위쪽, 방향은 화면 위 바깥의 복사점에서 멀어지는 쪽 */
function spawnMeteor(
  slot: MeteorSlot,
  mt: { radiantX: number; tmp: THREE.Vector3; radiant: THREE.Vector3 },
  camera: THREE.Camera,
  lengthMul: number,
  now: number,
) {
  const toSky = (v: THREE.Vector3, x: number, y: number) =>
    v.set(x, y, 0.5).unproject(camera).sub(camera.position).normalize();
  // 복사점: 화면 위쪽 바깥 (NDC y 1.6). 모든 별똥별이 여기서 퍼져 나와 같은 유성우처럼 보인다
  toSky(mt.radiant, mt.radiantX, 1.6);
  // 시작점: 화면에 보이는 하늘의 맨 위쪽. 땅이 화면 아래쪽을 덮어 하늘은 지평선 위로만 보이므로,
  // 지금 카메라에서 지평선이 놓인 화면 높이를 구하고 그 위 하늘 구간의 위쪽 15% ~ 화면 위 바깥 조금에서 시작한다
  // (바깥에서 시작하면 위에서 들어온다). 카메라 높이·각도가 바뀌어도 늘 보이는 하늘 꼭대기에서 떨어진다
  camera.getWorldDirection(mt.tmp);
  mt.tmp.y = 0;
  const horizonY = THREE.MathUtils.clamp(
    mt.tmp.normalize().add(camera.position).project(camera).y,
    -1,
    0.9,
  );
  toSky(
    slot.from,
    THREE.MathUtils.randFloatSpread(1.7),
    horizonY + (1 - horizonY) * THREE.MathUtils.randFloat(0.85, 1.1),
  );
  if (slot.from.y < Math.sin(THREE.MathUtils.degToRad(6))) {
    slot.from.y = Math.sin(THREE.MathUtils.degToRad(6)); // 지평선에 너무 붙지 않게
    slot.from.normalize();
  }
  // 방향: 복사점→시작점 대원을 따라 복사점에서 멀어지는 쪽 (시작점에서의 접선)
  const dir = mt.tmp
    .copy(slot.from)
    .multiplyScalar(slot.from.dot(mt.radiant))
    .sub(mt.radiant)
    .normalize();
  const len = THREE.MathUtils.degToRad(
    THREE.MathUtils.randFloat(20, 40) * lengthMul,
  );
  slot.to
    .copy(slot.from)
    .multiplyScalar(Math.cos(len))
    .addScaledVector(dir, Math.sin(len))
    .normalize();
  slot.dur = THREE.MathUtils.randFloat(0.3, 0.6); // 순식간에 긋고 사라지게
  slot.start = now;
}

export default function Sky() {
  const old = useLab((s) => s.night.skyQuality === "old");
  const gl = useThree((s) => s.gl);
  const mesh = useRef<THREE.Mesh>(null!);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        defines: old ? { SKY_OLD: "" } : {},
        uniforms: {
          uMoonDir: { value: MOON_DIR },
          uZenith: { value: new THREE.Color("#02040b") },
          uHorizon: { value: new THREE.Color("#16213d") },
          uTree: { value: new THREE.Color("#03050a") },
          uMoon: { value: new THREE.Color("#e8eeff") },
          uTime: { value: 0 },
          uMilkyTex: { value: null },
          uMilky: { value: 1 },
          uMilkyRot: { value: 0 },
          uStarDensity: { value: 1 },
          uStarBright: { value: 1 },
          uTwinkle: { value: 0.15 },
          uTreeLayers: { value: 3 },
          uTreeHeight: { value: 1 },
          uReflect: { value: 0 },
          uMeteorHead: {
            value: METEOR_SLOTS.map(() => new THREE.Vector3(0, 1, 0)),
          },
          uMeteorTail: {
            value: METEOR_SLOTS.map(() => new THREE.Vector3(0, 1, 0)),
          },
          uMeteorAlpha: { value: new THREE.Vector4() },
        },
      }),
    [old],
  );
  useEffect(() => () => material.dispose(), [material]);

  // 은하수는 처음 한 번만 굽는다 (재질이 바뀌어도 같은 텍스처를 쓴다)
  // 암흑대 세기를 바꿀 때만 다시 굽는다 (매 프레임 비용 없음)
  const lane = useLab((s) => s.night.milkyLanes);
  const milky = useMemo(() => bakeMilkyWay(gl, MILKY_NORMAL, lane), [gl, lane]);
  useEffect(() => () => milky.dispose(), [milky]);

  // 그리기 직전에 카메라를 보고 물웅덩이 반사인지 판단한다.
  // 반사 카메라는 반사 레이어만 보고 레이어 0(메인)은 보지 않는다 (Water.tsx).
  // 카메라가 바뀌면 three가 uniform을 다시 올리므로 같은 프레임 안에서도 값이 반영된다.
  useEffect(() => {
    const m = mesh.current;
    m.onBeforeRender = (_r, _s, camera, _g, mat) => {
      const sm = mat as THREE.ShaderMaterial;
      sm.uniforms.uReflect.value = camera.layers.isEnabled(0) ? 0 : 1;
      sm.uniformsNeedUpdate = true; // 같은 프레임 안에서 값이 바뀌므로 다시 올리게 한다
    };
    return () => {
      m.onBeforeRender = () => {};
    };
  }, []);

  // 별똥별 스케줄: 유성우처럼 화면 위쪽 바깥의 한 점(복사점)에서 퍼져 나오며 화면 쪽으로 떨어진다
  const meteor = useRef({
    next: 3, // 다음 별똥별 시각 (초)
    radiantX: THREE.MathUtils.randFloatSpread(1.2), // 복사점의 화면 가로 위치 (NDC)
    slots: METEOR_SLOTS.map(() => ({
      start: -1,
      dur: 1,
      from: new THREE.Vector3(),
      to: new THREE.Vector3(),
      head: new THREE.Vector3(0, 1, 0),
      tail: new THREE.Vector3(0, 1, 0),
    })),
    tmp: new THREE.Vector3(),
    radiant: new THREE.Vector3(),
    pending: [] as number[], // 이번 차례에 띄울 별똥별들의 시각
    trigger: 0,
  });

  useFrame(({ clock, camera }) => {
    const n = useLab.getState().night;
    // 재질은 메시에서 꺼내 쓴다 (useMemo 값을 직접 고치면 React 컴파일러 규칙에 걸린다)
    const u = (mesh.current.material as THREE.ShaderMaterial).uniforms;
    u.uTime.value = clock.elapsedTime;
    setMoonDir(n.moonAz, n.moonEl); // uMoonDir가 같은 객체를 참조한다
    u.uMilkyTex.value = milky.texture;
    u.uMilky.value = n.milkyWay;
    u.uMilkyRot.value = THREE.MathUtils.degToRad(n.milkyRotation);
    u.uStarDensity.value = n.starDensity;
    u.uStarBright.value = n.starBright;
    u.uTwinkle.value = n.starTwinkle;
    u.uTreeLayers.value = n.treeLayers;
    u.uTreeHeight.value = n.treeHeight;

    const mt = meteor.current;
    const now = clock.elapsedTime;
    if (n.meteorNow !== mt.trigger) {
      mt.trigger = n.meteorNow; // 실험실 "바로 보기" 버튼
      mt.next = now;
    }
    if (n.meteors && now >= mt.next) {
      // 차례마다 최소~최대 개수 사이를 골라 0~0.3초 사이에 거의 함께 띄운다
      const count = THREE.MathUtils.randInt(
        Math.min(n.meteorMin, n.meteorMax),
        n.meteorMax,
      );
      mt.pending.push(now);
      for (let k = 1; k < count; k++)
        mt.pending.push(now + THREE.MathUtils.randFloat(0.03, 0.3));
      // 간격을 크게 흔들어 몰려서 떨어질 때와 한동안 조용할 때가 생기게 한다
      mt.next = now + n.meteorInterval * THREE.MathUtils.randFloat(0.3, 1.7);
    }
    // 시각이 된 별똥별을 빈 칸에 띄운다. 최대 개수만큼의 칸만 쓰고, 다 차 있으면 버린다
    mt.pending = mt.pending.filter((at) => {
      if (at > now) return true;
      const slot = mt.slots.slice(0, n.meteorMax).find((s) => s.start < 0);
      if (slot) spawnMeteor(slot, mt, camera, n.meteorLength, now);
      return false;
    });
    const alpha = u.uMeteorAlpha.value as THREE.Vector4;
    mt.slots.forEach((sl, i) => {
      let a = 0;
      if (sl.start >= 0) {
        const p = (now - sl.start) / sl.dur;
        if (p >= 1) sl.start = -1;
        else {
          // 머리는 시작→끝으로 가고, 꼬리는 머리 뒤 전체 길이의 75%까지 길게 따라온다
          sl.head.lerpVectors(sl.from, sl.to, p).normalize();
          sl.tail
            .lerpVectors(sl.from, sl.to, Math.max(0, p - 0.75))
            .normalize();
          // 빠르게 켜지고 마지막 30%에서 서서히 꺼진다
          a =
            THREE.MathUtils.smoothstep(p, 0, 0.06 / sl.dur) *
            (1 - THREE.MathUtils.smoothstep(p, 0.7, 1)) *
            n.meteorBright;
        }
      }
      u.uMeteorHead.value[i].copy(sl.head);
      u.uMeteorTail.value[i].copy(sl.tail);
      alpha.setComponent(i, a);
    });
  });

  return (
    <mesh ref={mesh} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[40, 48, 24]} />
    </mesh>
  );
}
