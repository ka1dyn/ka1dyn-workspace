import { useLab } from "@/lab/store";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { GRASS_LAYER } from "./constants";
import { clumpNoise, getWindTexture } from "./noise";
import { useTerrainSampler } from "./terrain";

// 인스턴스 잔디: 위로 갈수록 좁아지는 띠 하나를 InstancedMesh로 수만 번 그린다 (드로우콜 1).
// 조명 계산 없이 높이 그라데이션 + 바람 밝기 + 퍼걸러 등의 따뜻한 빛을 셰이더에서 흉내 낸다.
// 돌 지형 표면에 심고, 수면보다 낮은 곳(물웅덩이)은 비우며, 지형 알파맵을 따라 가장자리에서 작아진다.

const INNER = 1.75; // 타일 바닥(3.2×3.2)과 퍼걸러를 비우는 정사각형 반폭
// 잔디를 심는 원의 반지름. 지형(알파맵이 약 7.3m에서 0)보다 멀리까지 심어서,
// 땅이 먼저 사라지고 잔디는 그 너머에서 어둠 속으로 천천히 묻히게 한다.
const OUTER = 10.5;
// 잔디 색이 어두워지기 시작하는 반지름. OUTER까지 넓은 구간에 걸쳐 서서히 어두워진다
const FADE_START = 4.5;
const SHORE = 0.015; // 수면보다 이만큼 높은 곳부터 심는다

function createBladeGeometry(segments: number) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const width = 0.5 * (1 - t * t);
    positions.push(-width, t, 0, width, t, 0);
    uvs.push(0, t, 1, t);
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

const vertexShader = /* glsl */ `
  #include <fog_pars_vertex>
  uniform sampler2D uWind;
  uniform float uTime;
  uniform float uHeightScale;
  uniform float uWidthScale;
  uniform float uWindStrength;
  uniform float uWindSpeed;
  varying float vHeight;
  varying float vWind;
  varying vec3 vWorld;
  attribute float aEdge; // 지형 가장자리 정도 (1: 안쪽, 0: 땅이 사라지는 끝)
  varying float vEdge;

  void main() {
    vEdge = aEdge;
    // 높이·폭 배율은 잎 로컬 좌표에 곱한다 (배치는 그대로 두고 크기만 바꾼다)
    vec3 local = position * vec3(uWidthScale, uHeightScale, 1.0);
    vec4 world = modelMatrix * instanceMatrix * vec4(local, 1.0);
    float wind = 0.5;
    #ifdef WIND
      // 잎 뿌리(인스턴스 행렬의 이동 성분)와 잎 길이(인스턴스 y 배율 × 높이 배율)
      vec3 root = (modelMatrix * instanceMatrix[3]).xyz;
      float len = length(instanceMatrix[1].xyz) * uHeightScale;
      float time = uTime * uWindSpeed; // 바람 속도 배율

      // 들판 전체가 파도치듯 움직이게 한다: 잎마다 따로 흔들리지 않고,
      // 바람 방향 위치로 위상을 정해 "눕는 띠"가 들판을 가로질러 흘러가게 한다.

      // 1) 바람 방향: 들판 전체가 함께 천천히 바뀐다 (장소마다 흩뜨리지 않음)
      float ang = 0.6 + (texture2D(uWind, vec2(time * 0.004, 0.37)).a - 0.5) * 1.6
                      + (texture2D(uWind, root.xz * 0.006).a - 0.5) * 0.4;
      vec2 dir = vec2(cos(ang), sin(ang));
      vec2 perp = vec2(-dir.y, dir.x);

      // 2) 파도: 바람 방향 좌표를 따라 흘러가는 두 개의 물결을 겹친다.
      //    파장이 다르고 방향이 조금 어긋나서 마루가 직선으로 늘어서지 않는다.
      float along = dot(root.xz, dir);
      float across = dot(root.xz, perp);
      float w1 = sin(along * 1.4 - time * 2.0 + sin(across * 0.45) * 1.2);
      float w2 = sin(dot(root.xz, vec2(cos(ang + 0.5), sin(ang + 0.5))) * 2.3 - time * 3.0);
      float wave = clamp(0.5 + 0.38 * w1 + 0.2 * w2, 0.0, 1.0);
      wave = wave * wave; // 마루는 좁고 뚜렷하게, 골은 넓게

      // 3) 돌풍: 큰 덩어리가 바람 방향으로 흘러가며 파도의 세기를 키우고 줄인다
      float gust = texture2D(uWind, root.xz * 0.02 - dir * time * 0.04).g;
      gust = 0.35 + 0.65 * smoothstep(0.25, 0.75, gust);

      // 4) 잎마다 차이는 작게만: 뻣뻣함과 아주 작은 위상 어긋남
      float seed = texture2D(uWind, root.xz * 0.5).b;
      float stiff = 0.8 + seed * 0.4;
      float jitter = sin(time * 0.7 + seed * 6.28) * 0.04;
      // 잎끝이 뿌리보다 살짝 늦게 따라와 낭창하게 휜다
      float lag = sin(along * 1.4 - time * 2.0 - uv.y * 0.6) * 0.05;

      // 잎끝의 휘는 각도(라디안): 마루가 지나갈 때 바람 쪽으로 눕고 골에서는 다시 선다
      float lean = (0.08 + gust * wave * 0.95 + jitter + lag) * uWindStrength / stiff;
      vec2 b = dir * lean;
      float theta = clamp(length(b), 0.0, 1.35);
      vec2 bdir = theta > 1e-4 ? b / length(b) : dir;

      // 원호를 따라 휜다: 잎 길이를 유지하므로 센 바람에도 잎이 늘어나지 않는다.
      // 높이 t에서의 위치 = ∫(sin θs, cos θs) ds  →  수평 L(1-cos θt)/θ, 수직 L sin(θt)/θ
      float t = uv.y;
      float horiz = theta > 1e-3 ? len * (1.0 - cos(theta * t)) / theta : 0.0;
      float vert = theta > 1e-3 ? len * sin(theta * t) / theta : len * t;
      vec3 rel = world.xyz - root; // 잎 폭과 기울기 성분
      world.xyz = root + vec3(rel.x, 0.0, rel.z) + vec3(bdir.x * horiz, vert, bdir.y * horiz);

      wind = gust * wave; // 마루가 지나가는 곳이 밝아져 파도가 눈에 보인다
    #endif
    vHeight = uv.y;
    vWind = wind;
    vWorld = world.xyz;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  #include <fog_pars_fragment>
  uniform vec3 uBase;
  uniform vec3 uTip;
  uniform vec3 uLampPos;
  uniform vec3 uLampColor;
  uniform float uLampIntensity;
  varying float vHeight;
  varying float vWind;
  varying vec3 vWorld;
  varying float vEdge;
  uniform vec3 uEdgeColor;

  void main() {
    vec3 color = mix(uBase, uTip, vHeight * vHeight);
    color *= 0.6 + vWind * 0.8;
    // 퍼걸러 아래 등의 빛: 수평 거리 제곱으로 줄어드는 따뜻한 색을 잎 끝에 더한다
    vec2 d = vWorld.xz - uLampPos.xz;
    color += uLampColor * uLampIntensity * 0.05 * vHeight / (1.0 + dot(d, d) * 0.6);
    // 땅이 투명해지며 뒤의 어두운 하늘에 녹아드는 것처럼, 가장자리 잎은 같은 어두운 색으로 섞는다
    color = mix(uEdgeColor, color, vEdge);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

// 시드 고정 난수 (mulberry32). 같은 개수면 매번 같은 배치가 나온다.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface GrassProps {
  count: number;
  segments: number;
  wind: boolean;
  inReflection: boolean;
}

export default function Grass({
  count,
  segments,
  wind,
  inReflection,
}: GrassProps) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const terrain = useTerrainSampler();
  // 수면 높이가 바뀌면 물에 잠기는 자리가 달라지므로 다시 심는다
  const waterLevel = useLab((s) => s.night.waterLevel);
  const puddles = useLab((s) => s.night.puddles);
  const onWater = useLab((s) => s.night.grassOnWater);

  const geometry = useMemo(() => createBladeGeometry(segments), [segments]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        fog: true,
        defines: wind ? { WIND: "" } : {},
        uniforms: {
          ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
          uWind: { value: getWindTexture() },
          uTime: { value: 0 },
          uHeightScale: { value: 1 },
          uWidthScale: { value: 1 },
          uWindStrength: { value: 1 },
          uWindSpeed: { value: 1 },
          uBase: { value: new THREE.Color("#050c08") },
          uTip: { value: new THREE.Color("#3f6a62") },
          // 땅 너머로 보이는 하늘 아래쪽(Sky.tsx의 숲 실루엣 색)과 맞춘다
          uEdgeColor: { value: new THREE.Color("#03050a") },
          uLampPos: { value: new THREE.Vector3() },
          uLampColor: { value: new THREE.Color() },
          uLampIntensity: { value: 0 },
        },
      }),
    [wind],
  );

  // 이전 지오메트리·재질은 바뀌거나 언마운트될 때 해제한다 (R3F는 prop으로 넘긴 객체를 해제하지 않는다)
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  useLayoutEffect(() => () => material.dispose(), [material]);

  useLayoutEffect(() => {
    const m = mesh.current;
    const rand = rng(7);
    const dummy = new THREE.Object3D();
    let placed = 0;
    // 잎마다 가장자리 정도를 넣는 인스턴스 속성. 개수가 바뀔 때마다 새로 만든다
    const edge = new Float32Array(count);
    let guard = 0;
    while (placed < count && guard++ < count * 20) {
      // 원 안에 균일하게 뽑는다
      const r = Math.sqrt(rand()) * OUTER;
      const a = rand() * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (Math.abs(x) < INNER && Math.abs(z) < INNER) continue;
      // 땅 밖(알파 0)은 지형 높이가 없으므로 가장자리 높이를 그대로 이어 쓴다 (heightAt이 경계로 고정)
      const onGround = terrain.alphaAt(x, z) > 0.02;
      const y = terrain.heightAt(x, z);
      // 물웅덩이(수면보다 낮은 곳)와 그 물가는 비운다. 수면이 없는 땅 밖은 검사하지 않는다
      if (onGround && puddles && !onWater && y < waterLevel + SHORE) continue;
      dummy.position.set(x, y - 0.01, z);
      // 잎마다 살짝 기울여 한 방향으로 곧게 선 느낌을 없앤다
      dummy.rotation.set(
        (rand() - 0.5) * 0.35,
        rand() * Math.PI * 2,
        (rand() - 0.5) * 0.35,
      );
      // 키: 짧은 잎이 많고 가끔 긴 잎이 섞이게(거듭제곱 분포), 군락 노이즈로 키 큰 덤불과 낮은 곳을 만든다
      const clump = 0.55 + clumpNoise(x, z) * 0.9;
      const height = (0.08 + Math.pow(rand(), 1.6) * 0.32) * clump;
      dummy.scale.set(0.018 + rand() * 0.017, height, 1);
      dummy.updateMatrix();
      // 가장자리는 키·밀도를 건드리지 않고 색만 어둡게 한다(셰이더의 aEdge).
      // 거리 기준으로 FADE_START부터 OUTER까지 부드럽게 1 → 0
      edge[placed] = 1 - THREE.MathUtils.smoothstep(r, FADE_START, OUTER);
      m.setMatrixAt(placed++, dummy.matrix);
    }
    m.count = placed;
    m.geometry.setAttribute(
      "aEdge",
      new THREE.InstancedBufferAttribute(edge, 1),
    );
    m.instanceMatrix.needsUpdate = true;
  }, [count, geometry, terrain, waterLevel, puddles, onWater]);

  useLayoutEffect(() => {
    if (inReflection) mesh.current.layers.enable(GRASS_LAYER);
    else mesh.current.layers.disable(GRASS_LAYER);
  }, [inReflection]);

  useFrame(({ clock }) => {
    const n = useLab.getState().night;
    const u = (mesh.current.material as THREE.ShaderMaterial).uniforms;
    u.uTime.value = clock.elapsedTime;
    u.uHeightScale.value = n.grassHeight;
    u.uWidthScale.value = n.grassWidth;
    u.uWindStrength.value = n.windStrength;
    u.uWindSpeed.value = n.windSpeed;
    u.uLampPos.value.fromArray(n.lampPos);
    u.uLampColor.value.set(n.lampColor);
    u.uLampIntensity.value = n.lampIntensity;
  });

  return (
    <instancedMesh
      // 개수가 바뀌면 버퍼 크기가 달라지므로 새로 만든다
      key={count}
      ref={mesh}
      args={[undefined, undefined, count]}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  );
}
