import { useLab } from "@/lab/store";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { GRASS_LAYER } from "./constants";
import { clumpNoise, getWindTexture } from "./noise";
import { InteractionMap } from "./interaction";
import { terrainLayout, useTerrainSampler } from "./terrain";
import { lightningUniforms } from "./lightning";

// 인스턴스 잔디: 위로 갈수록 좁아지는 띠 하나를 InstancedMesh로 수만 번 그린다 (드로우콜 1).
// 조명 계산 없이 높이 그라데이션 + 바람 밝기 + 퍼걸러 등의 따뜻한 빛을 셰이더에서 흉내 낸다.
// 돌 지형 표면에 심고, 수면보다 낮은 곳(물웅덩이)은 비우며, 지형 알파맵을 따라 가장자리에서 작아진다.

const INNER = 1.75; // 타일 바닥(3.2×3.2)과 퍼걸러를 비우는 정사각형 반폭
const SHORE = 0.015; // 수면보다 이만큼 높은 곳부터 심는다
// 커서를 투영하는 땅 높이. 지형 평균 높이 근처에 잎 중간쯤을 맞춘다
const CURSOR_PLANE_Y = 0.1;

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
  uniform sampler2D uPush;   // 눌림 지도 (interaction.ts): rg = 눕는 방향 × 세기
  uniform float uPushExtent; // 눌림 지도가 덮는 월드 한 변 (m)
  uniform float uPushAngle;  // 세기 1일 때 휘는 각도 (라디안)
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
    // 잎 뿌리(인스턴스 행렬의 이동 성분)와 잎 길이(인스턴스 y 배율 × 높이 배율)
    vec3 root = (modelMatrix * instanceMatrix[3]).xyz;
    float len = length(instanceMatrix[1].xyz) * uHeightScale;
    // 잎끝이 휘는 방향과 각도(라디안)를 벡터 하나에 모은다. 바람과 커서가 각자 더한다.
    vec2 b = vec2(0.0);
    vec2 dir = vec2(1.0, 0.0);

    #ifdef WIND
      float time = uTime * uWindSpeed; // 바람 속도 배율

      // 들판 전체가 파도치듯 움직이게 한다: 잎마다 따로 흔들리지 않고,
      // 바람 방향 위치로 위상을 정해 "눕는 띠"가 들판을 가로질러 흘러가게 한다.

      // 1) 바람 방향: 들판 전체가 함께 천천히 바뀐다 (장소마다 흩뜨리지 않음)
      float ang = 0.6 + (texture2D(uWind, vec2(time * 0.004, 0.37)).a - 0.5) * 1.6
                      + (texture2D(uWind, root.xz * 0.006).a - 0.5) * 0.4;
      dir = vec2(cos(ang), sin(ang));
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

      // 마루가 지나갈 때 바람 쪽으로 눕고 골에서는 다시 선다
      float lean = (0.08 + gust * wave * 0.95 + jitter + lag) * uWindStrength / stiff;
      b += dir * lean;
      wind = gust * wave; // 마루가 지나가는 곳이 밝아져 파도가 눈에 보인다
    #endif

    #ifdef CURSOR
      // 커서 밀기: 커서가 쓸고 지나간 방향으로 눕고, 눌림 지도가 옅어지는 만큼 천천히 다시 선다.
      // 세기는 일정한 속도로 줄어들고(interaction.ts), 휘는 정도는 세기의 제곱을 따른다:
      // 눌린 순간부터 바로 일어나기 시작해 끝으로 갈수록 감속하며 회복 시간에 맞춰 똑바로 선다.
      // 잎마다 뻣뻣함과 복원 속도를 달리해 한 덩어리로 움직이지 않게 한다.
      vec2 push = texture2D(uPush, root.xz / uPushExtent + 0.5).rg;
      float pushLen = length(push);
      if (pushLen > 1e-4) {
        float pseed = texture2D(uWind, root.xz * 0.5 + 0.31).b;
        float pstiff = 0.75 + pseed * 0.5;
        // 잎마다 회복 속도를 ±20% 다르게: 남은 세기를 그만큼 앞당기거나 늦춘다
        float k = clamp(1.0 - (1.0 - pushLen) * (0.8 + 0.4 * pseed), 0.0, 1.0);
        float lean = k * k;
        b += push / pushLen * lean * uPushAngle / pstiff;
      }
    #endif

    // 휘는 각도 상한은 딱 자르지 않고 부드럽게 포화시킨다(tanh).
    // clamp로 자르면 세게 눌린 잎들이 상한에 붙어 같은 각도로 멈춰 있다가, 상한 아래로 내려와서야 움직였다.
    float theta = 1.35 * tanh(length(b) / 1.35);
    if (theta > 1e-3) {
      vec2 bdir = b / length(b);
      // 원호를 따라 휜다: 잎 길이를 유지하므로 세게 눌려도 잎이 늘어나지 않는다.
      // 높이 t에서의 위치 = ∫(sin θs, cos θs) ds  →  수평 L(1-cos θt)/θ, 수직 L sin(θt)/θ
      float t = uv.y;
      float horiz = len * (1.0 - cos(theta * t)) / theta;
      float vert = len * sin(theta * t) / theta;
      vec3 rel = world.xyz - root; // 잎 폭과 기울기 성분
      world.xyz = root + vec3(rel.x, 0.0, rel.z) + vec3(bdir.x * horiz, vert, bdir.y * horiz);
    }
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
  uniform float uFlash;      // 번개 섬광 세기 (Night/lightning.ts, 모든 셰이더가 공유)
  uniform vec3 uFlashColor;
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
    // 번개: 하늘에서 오는 빛이라 위를 향한 잎끝이 더 밝고, 바람 마루도 살짝 더 번쩍인다
    color += uFlashColor * uFlash * (0.04 + 0.22 * vHeight * vHeight) * (0.8 + vWind * 0.4);
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
  const groundSize = useLab((s) => s.night.groundSize);
  const layout = useMemo(() => terrainLayout(groundSize), [groundSize]);
  const terrain = useTerrainSampler(layout);
  // 잔디를 심는 원의 반지름: 지형(알파맵이 한 변의 약 0.49배 거리에서 0)보다 3m 더 멀리 심어서,
  // 땅이 먼저 사라지고 잔디는 그 너머에서 어둠 속으로 천천히 묻히게 한다.
  const outer = groundSize * 0.5 + 3;
  // 잔디 색이 어두워지기 시작하는 반지름 (15m 땅에서 4.5m). outer까지 넓은 구간에 걸쳐 서서히 어두워진다
  const fadeStart = groundSize * 0.3;
  // 수면 높이가 바뀌면 물에 잠기는 자리가 달라지므로 다시 심는다.
  // 다시 심기는 잎 10만 개를 도는 무거운 작업이라, 슬라이더를 끄는 동안 매번 하지 않고
  // 멈춘 뒤 한 번만 한다 (수면 자체는 Water가 매 프레임 바로 따라간다).
  const liveWaterLevel = useLab((s) => s.night.waterLevel);
  const [waterLevel, setWaterLevel] = useState(liveWaterLevel);
  useEffect(() => {
    const t = window.setTimeout(() => setWaterLevel(liveWaterLevel), 150);
    return () => window.clearTimeout(t);
  }, [liveWaterLevel]);
  const puddles = useLab((s) => s.night.puddles);
  const onWater = useLab((s) => s.night.grassOnWater);
  const cursorPush = useLab((s) => s.night.cursorPush);

  const geometry = useMemo(() => createBladeGeometry(segments), [segments]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        fog: true,
        defines: {
          ...(wind ? { WIND: "" } : {}),
          ...(cursorPush ? { CURSOR: "" } : {}),
        },
        uniforms: {
          ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
          uWind: { value: getWindTexture() },
          uTime: { value: 0 },
          uHeightScale: { value: 1 },
          uWidthScale: { value: 1 },
          uWindStrength: { value: 1 },
          uWindSpeed: { value: 1 },
          uPush: { value: null },
          uPushExtent: { value: 1 },
          uPushAngle: { value: 1.0 },
          uBase: { value: new THREE.Color("#050c08") },
          uTip: { value: new THREE.Color("#3f6a62") },
          // 땅 너머로 보이는 하늘 아래쪽(Sky.tsx의 숲 실루엣 색)과 맞춘다
          uEdgeColor: { value: new THREE.Color("#03050a") },
          uLampPos: { value: new THREE.Vector3() },
          uLampColor: { value: new THREE.Color() },
          uLampIntensity: { value: 0 },
          ...lightningUniforms(),
        },
      }),
    [wind, cursorPush],
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
      const r = Math.sqrt(rand()) * outer;
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
      // 거리 기준으로 fadeStart부터 outer까지 부드럽게 1 → 0
      edge[placed] = 1 - THREE.MathUtils.smoothstep(r, fadeStart, outer);
      m.setMatrixAt(placed++, dummy.matrix);
    }
    m.count = placed;
    m.geometry.setAttribute(
      "aEdge",
      new THREE.InstancedBufferAttribute(edge, 1),
    );
    m.instanceMatrix.needsUpdate = true;
  }, [
    count,
    geometry,
    terrain,
    outer,
    fadeStart,
    waterLevel,
    puddles,
    onWater,
  ]);

  useLayoutEffect(() => {
    if (inReflection) mesh.current.layers.enable(GRASS_LAYER);
    else mesh.current.layers.disable(GRASS_LAYER);
  }, [inReflection]);

  // ---- 커서 밀기: 화면 커서를 땅 높이 평면에 투영하고, 지나간 길을 눌림 지도에 기록한다 ----
  // 장면 전체에 레이캐스트하지 않고 평면 하나와만 교차시켜서 비용이 거의 없다.
  const gl = useThree((s) => s.gl);
  // 매 프레임 바뀌는 값이라 렌더와 상관없는 ref에 둔다
  const cursorRef = useRef({
    raycaster: new THREE.Raycaster(),
    plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -CURSOR_PLANE_Y),
    hit: new THREE.Vector3(),
    pos: new THREE.Vector2(), // 부드럽게 따라가는 커서 위치 (x, z)
    prev: new THREE.Vector2(), // 지난 프레임 위치
    target: new THREE.Vector2(),
    dir: new THREE.Vector2(1, 0), // 이동 방향 (부드럽게 돈다)
    move: new THREE.Vector2(),
    speed: 0,
    inside: false,
    ready: false,
    idle: 0, // 커서가 잔디를 누르지 않은 채 지난 시간 (초)
    map: null as InteractionMap | null,
  });
  useEffect(() => {
    const c = cursorRef.current;
    return () => {
      c.map?.dispose();
      c.map = null;
    };
  }, []);
  useEffect(() => {
    // 캔버스 밖(패널·HUD 위 포함)으로 나가면 밀기를 서서히 끈다
    const cursor = cursorRef.current;
    const el = gl.domElement.parentElement ?? gl.domElement;
    const enter = () => (cursor.inside = true);
    const leave = () => (cursor.inside = false);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointermove", enter);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointermove", enter);
    };
  }, [gl]);

  useFrame(({ clock, pointer, camera }, delta) => {
    const n = useLab.getState().night;
    const u = (mesh.current.material as THREE.ShaderMaterial).uniforms;
    if (n.cursorPush) {
      const c = cursorRef.current;
      const dt = Math.min(delta, 0.05);
      c.map ??= new InteractionMap();
      c.raycaster.setFromCamera(pointer, camera);
      const onGround =
        c.inside && c.raycaster.ray.intersectPlane(c.plane, c.hit) !== null;
      // 처음 들어오거나 캔버스 밖에서 다시 들어오면 그 자리로 바로 옮긴다
      // (안 그러면 이전 위치에서 새 위치까지 쓸고 지나간 것처럼 잔디가 눌린다)
      if (onGround && !c.ready) {
        c.pos.set(c.hit.x, c.hit.z);
        c.prev.copy(c.pos);
      }
      c.ready = onGround;
      c.prev.copy(c.pos);
      let stamp = 0;
      if (onGround) {
        // 위치는 빠르게 따라가서 떨림만 없앤다
        c.target.set(c.hit.x, c.hit.z);
        c.pos.lerp(c.target, 1 - Math.exp(-dt * 25));
        c.move.subVectors(c.pos, c.prev);
        const dist = c.move.length();
        c.speed +=
          (dist / Math.max(dt, 1e-3) - c.speed) * (1 - Math.exp(-dt * 25));
        // 이동 방향을 부드럽게 따라가 잎이 커서가 움직인 쪽으로 눕는다
        if (dist > 1e-4) {
          c.move.divideScalar(dist);
          c.dir.lerp(c.move, 1 - Math.exp(-dt * 12)).normalize();
        }
        // 누름은 커서가 다가온 거리만큼만 생기므로(interaction.ts) 여기서는 세기 배율만 정한다.
        // 빠르게 쓸수록 조금 더 세게 (초당 2m 이상이면 최대)
        stamp = n.cursorStrength * (0.7 + 0.3 * Math.min(c.speed / 2, 1));
      } else {
        c.speed = 0;
      }
      // 들판 전체(잔디를 심는 원)를 덮는 크기
      const extent = outer * 2;
      // 눌림은 커서가 움직일 때만 생기고 회복 시간이 지나면 지도가 전부 0이 된다.
      // 그 뒤로는 갱신해도 결과가 같으므로 건너뛴다 (매 프레임 256² 패스 1번과 렌더 타깃 전환 2번).
      const pressing = stamp > 0 && c.prev.distanceToSquared(c.pos) > 1e-10;
      c.idle = pressing ? 0 : c.idle + dt;
      const settled = c.idle > Math.max(n.cursorRecover, 0.05) + 0.1;
      if (!settled)
        c.map.update(gl, {
          extent,
          from: c.prev,
          to: c.pos,
          dir: c.dir,
          stamp,
          radius: n.cursorRadius,
          recover: dt / Math.max(n.cursorRecover, 0.05),
        });
      u.uPush.value = c.map.texture;
      u.uPushExtent.value = extent;
    }
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
