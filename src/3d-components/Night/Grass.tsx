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
const OUTER = 7.5; // 잔디를 심는 원의 반지름. 지형 알파맵이 약 7.3m에서 0이 된다
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
  varying float vHeight;
  varying float vWind;
  varying vec3 vWorld;

  void main() {
    // 높이·폭 배율은 잎 로컬 좌표에 곱한다 (배치는 그대로 두고 크기만 바꾼다)
    vec3 local = position * vec3(uWidthScale, uHeightScale, 1.0);
    vec4 world = modelMatrix * instanceMatrix * vec4(local, 1.0);
    float wind = 0.5;
    #ifdef WIND
      // 잎 뿌리 위치 (인스턴스 행렬의 이동 성분). 잎마다 위상을 다르게 주는 데 쓴다.
      vec2 root = (modelMatrix * instanceMatrix[3]).xz;
      vec2 dir = normalize(vec2(1.0, 0.55)); // 주 바람 방향
      // 1) 돌풍: 큰 노이즈 덩어리가 바람 방향으로 천천히 흘러가며 어떤 곳은 세고 어떤 곳은 약하다
      float gust = texture2D(uWind, root * 0.025 - dir * uTime * 0.045).g;
      gust = smoothstep(0.3, 0.75, gust);
      // 2) 흔들림: 돌풍 세기만큼 앞뒤로 출렁인다. 위상은 뿌리 위치로 흩뜨린다
      float phase = dot(root, vec2(1.7, 2.3)) + texture2D(uWind, root * 0.3).b * 6.28;
      float sway = sin(uTime * 2.1 + phase) * 0.5 + 0.5;
      // 3) 잔떨림: 작은 노이즈를 빠르게 흘려 잎끝이 제각각 떨리게 한다
      vec2 flutter = texture2D(uWind, root * 0.18 + uTime * vec2(0.35, 0.22)).rg - 0.5;
      float bend = (0.15 + gust * (0.55 + 0.45 * sway)) * uWindStrength;
      vec2 offset = dir * bend * 0.32 + flutter * 0.12 * uWindStrength;
      // 끝으로 갈수록 크게 휘고(높이의 제곱), 휜 만큼 잎끝이 내려앉게 한다
      float h = uv.y * uv.y;
      offset *= h * uHeightScale;
      world.xz += offset;
      world.y -= dot(offset, offset) * 1.2;
      wind = gust * (0.6 + 0.4 * sway);
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

  void main() {
    vec3 color = mix(uBase, uTip, vHeight * vHeight);
    color *= 0.6 + vWind * 0.8;
    // 퍼걸러 아래 등의 빛: 수평 거리 제곱으로 줄어드는 따뜻한 색을 잎 끝에 더한다
    vec2 d = vWorld.xz - uLampPos.xz;
    color += uLampColor * uLampIntensity * 0.05 * vHeight / (1.0 + dot(d, d) * 0.6);
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
          uBase: { value: new THREE.Color("#050c08") },
          uTip: { value: new THREE.Color("#3f6a62") },
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
    let guard = 0;
    while (placed < count && guard++ < count * 20) {
      // 원 안에 균일하게 뽑는다
      const r = Math.sqrt(rand()) * OUTER;
      const a = rand() * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (Math.abs(x) < INNER && Math.abs(z) < INNER) continue;
      // 지형 가장자리(알파맵)를 따라 잎을 줄여 지형과 함께 사라지게 한다
      const fade = THREE.MathUtils.smoothstep(terrain.alphaAt(x, z), 0.05, 0.6);
      if (fade < 0.05) continue;
      const y = terrain.heightAt(x, z);
      // 물웅덩이(수면보다 낮은 곳)와 그 물가는 비운다
      if (puddles && !onWater && y < waterLevel + SHORE) continue;
      dummy.position.set(x, y - 0.01, z);
      // 잎마다 살짝 기울여 한 방향으로 곧게 선 느낌을 없앤다
      dummy.rotation.set(
        (rand() - 0.5) * 0.35,
        rand() * Math.PI * 2,
        (rand() - 0.5) * 0.35,
      );
      // 키: 짧은 잎이 많고 가끔 긴 잎이 섞이게(거듭제곱 분포), 군락 노이즈로 키 큰 덤불과 낮은 곳을 만든다
      const clump = 0.55 + clumpNoise(x, z) * 0.9;
      const height = (0.08 + Math.pow(rand(), 1.6) * 0.32) * clump * fade;
      dummy.scale.set((0.018 + rand() * 0.017) * fade, height, 1);
      dummy.updateMatrix();
      m.setMatrixAt(placed++, dummy.matrix);
    }
    m.count = placed;
    m.instanceMatrix.needsUpdate = true;
  }, [count, terrain, waterLevel, puddles, onWater]);

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
