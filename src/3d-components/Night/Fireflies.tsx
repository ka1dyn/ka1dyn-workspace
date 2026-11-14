import { useLab } from "@/lab/store";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

// 반딧불이: 점(gl.POINTS) 하나를 빛 덩어리로 그려 드로우콜 1번으로 끝낸다.
//   - 움직임은 CPU가 아니라 셰이더에서 계산한다. 반딧불이마다 다른 주파수의 사인파를 겹쳐
//     저마다 불규칙하게 떠다니고 위아래로 살짝 오르내린다.
//   - 깜빡임: 3~6초 주기로 서서히 켜졌다 꺼진다. 꺼져 있을 때도 아주 희미하게 남는다.
//   - 빛을 더하는 블렌딩, 크기는 실제 크기(m)로 정해 원근에 맞게 작아진다.

const vertexShader = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uSize;       // 빛 번짐까지 포함한 지름 (m)
  uniform float uViewportH;  // 그리는 버퍼 높이 (px)
  uniform float uFalloff;    // 거리 감쇠: 1 = 실제 원근, 0 = 거리와 상관없이 같은 크기
  uniform float uMinPx;      // 최소 크기 (버퍼 px)
  uniform float uBright;
  varying float vGlow;
  varying float vDepth;

  void main() {
    vec4 s = aSeed;
    float t = uTime * uSpeed;
    vec3 p = position;
    // 서로 나누어떨어지지 않는 주파수의 사인파를 겹쳐 같은 길을 반복하지 않게 떠다닌다
    p.x += sin(t * (0.21 + s.x * 0.2) + s.y * 6.28) * 0.6 + sin(t * (0.53 + s.z * 0.3) + s.w * 6.28) * 0.25;
    p.z += cos(t * (0.17 + s.y * 0.2) + s.z * 6.28) * 0.6 + sin(t * (0.47 + s.x * 0.3) + s.x * 12.0) * 0.25;
    p.y += sin(t * (0.31 + s.w * 0.3) + s.x * 6.28) * 0.12 + sin(t * 1.3 + s.y * 20.0) * 0.04;

    // 깜빡임: 주기의 앞쪽에서 서서히 켜졌다가 꺼진다
    float period = 3.0 + s.z * 3.0;
    float ph = fract(uTime / period + s.w);
    float pulse = smoothstep(0.0, 0.12, ph) * (1.0 - smoothstep(0.45, 0.7, ph));
    vGlow = (0.12 + 0.88 * pulse) * uBright;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z;
    // 월드 크기 → 화면 픽셀. 기준 거리(8m, 전체 장면에서 들판까지)에서는 실제 크기로 보이고,
    // 그보다 멀거나 가까우면 (기준 / 깊이)^감쇠 만큼만 변해 멀리 있는 반딧불이가 너무 작아지지 않는다.
    float refDepth = 8.0;
    float atRef = uSize * uViewportH * 0.5 * projectionMatrix[1][1] / refDepth;
    gl_PointSize = max(atRef * pow(refDepth / max(vDepth, 0.05), uFalloff), uMinPx);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uCore;
  uniform float fogNear;
  uniform float fogFar;
  varying float vGlow;
  varying float vDepth;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0; // 점 중심 0 → 가장자리 1
    if (d > 1.0) discard;
    float core = 1.0 - smoothstep(0.0, 0.18, d);
    float halo = exp(-d * d * 7.0) * (1.0 - d);
    vec3 color = uColor * halo * 0.9 + uCore * core;
    // 더하기 블렌딩이라 안개색을 섞지 않고 밝기만 줄인다
    float fog = 1.0 - smoothstep(fogNear, fogFar, vDepth);
    gl_FragColor = vec4(color * vGlow * fog, 1.0);
  }
`;

// 시드 고정 난수 (mulberry32)
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PERGOLA = 1.8; // 퍼걸러 안(정사각형 반폭)은 비운다

export default function Fireflies() {
  const count = useLab((s) => s.night.fireflies);
  const groundSize = useLab((s) => s.night.groundSize);
  const maxHeight = useLab((s) => s.night.fireflyMaxHeight);
  const points = useRef<THREE.Points>(null!);

  const geometry = useMemo(() => {
    const rand = rng(23);
    const radius = groundSize * 0.45; // 잔디 위에서 주로 날게
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count * 4);
    let i = 0;
    while (i < count) {
      const r = Math.sqrt(rand()) * radius;
      const a = rand() * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (Math.abs(x) < PERGOLA && Math.abs(z) < PERGOLA) continue;
      // 잔디 끝(평균 약 0.4m, 최대 약 0.8m) 근처에 붙어 날고 가끔만 높이 오르도록
      // 낮은 쪽에 몰린 분포(거듭제곱)로 0.25m ~ 최대 높이 사이에 둔다
      pos.set([x, 0.25 + Math.pow(rand(), 2.2) * (maxHeight - 0.25), z], i * 3);
      seed.set([rand(), rand(), rand(), rand()], i * 4);
      i++;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
    return g;
  }, [count, groundSize, maxHeight]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
          uTime: { value: 0 },
          uSpeed: { value: 1 },
          uSize: { value: 0.2 },
          uViewportH: { value: 1 },
          uFalloff: { value: 0.5 },
          uMinPx: { value: 3 },
          uBright: { value: 1 },
          uColor: { value: new THREE.Color("#b8f05a") },
          uCore: { value: new THREE.Color("#fff6c8") },
        },
        fog: true, // fogNear/fogFar를 three가 채워 준다
        transparent: true,
        depthWrite: false,
        // 색은 더하되 알파는 건드리지 않는다.
        // 맥북 화면(drei Html, occlude="blending")은 캔버스에 알파 0인 구멍을 뚫어 뒤의 DOM을 보여 준다.
        // three의 AdditiveBlending은 알파도 더해(srcA·srcA + dstA) 구멍을 1로 메워 버려서,
        // 반딧불이가 화면 위에 겹치면 점 모양 그대로 캔버스가 불투명해져 검은 원이 생겼다.
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        blendSrcAlpha: THREE.ZeroFactor,
        blendDstAlpha: THREE.OneFactor,
      }),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock, gl }) => {
    if (!points.current) return;
    const n = useLab.getState().night;
    // 재질은 메시에서 꺼내 쓴다 (useMemo 값을 직접 고치면 React 컴파일러 규칙에 걸린다)
    const u = (points.current.material as THREE.ShaderMaterial).uniforms;
    u.uTime.value = clock.elapsedTime;
    u.uSpeed.value = n.fireflySpeed;
    u.uSize.value = n.fireflySize;
    u.uBright.value = n.fireflyBright;
    u.uViewportH.value = gl.domElement.height;
    u.uFalloff.value = n.fireflyFalloff;
    u.uMinPx.value = n.fireflyMinPx * gl.getPixelRatio(); // 패널 값은 CSS px
  });

  if (count === 0) return null;
  return (
    <points
      ref={points}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  );
}
