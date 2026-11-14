import { useLab } from "@/lab/store";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { MOON_DIR } from "./constants";

// 블룸 흉내: 화면 전체 후처리 없이 빗방울 셰이더 안에서 직접 번짐과 반짝임을 그린다.
//   - 번짐: 빗줄기 SDF까지의 거리로 부드럽게 줄어드는 빛을 줄기 주변에 더해 살짝 굵어 보이게 한다
//   - 더하기 블렌딩: 겹치거나 밝은 배경 앞에서 실제 빛처럼 더해진다
//   - 반짝임: 빗방울마다 가끔 짧게 밝아지고, 등·달 쪽에 가까울수록 더 밝게 빛을 받는다
// 렌더 타깃이 없고, 빗방울 판(300개)이 덮는 픽셀에서만 계산한다.

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  varying float vSeed;
  varying float vDepth;

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vSeed = fract(float(gl_InstanceID) * 0.6180339);
    vec4 mv = viewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uGlow;     // 번짐 세기
  uniform float uWidth;    // 번짐 폭
  uniform float uSparkle;  // 반짝임 빈도 (0~1)
  uniform vec3 uLampPos;
  uniform vec3 uLampColor;
  uniform float uLampIntensity;
  uniform vec3 uMoonDir;
  uniform vec3 uRainColor;
  uniform float fogNear;
  uniform float fogFar;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying float vSeed;
  varying float vDepth;

  // 기존 빗방울과 같은 모양: 아래가 둥글고 위로 가늘어지는 캡슐 5개를 위로 이어 붙인 줄기
  float sdUnevenCapsule(vec2 p, float r1, float r2, float h) {
    p.x = abs(p.x);
    float b = (r1 - r2) / h;
    float a = sqrt(1.0 - b * b);
    float k = dot(p, vec2(-b, a));
    if (k < 0.0) return length(p) - r1;
    if (k > a * h) return length(p - vec2(0.0, h)) - r2;
    return dot(p, vec2(a, b)) - r1;
  }

  void main() {
    vec2 coord = (vUv - 0.5) * 10.0;
    float core = 0.0;
    float d = 1e3;
    for (int i = 0; i < 5; i++) {
      float s = sdUnevenCapsule(coord, 0.05, 0.0, 2.0);
      core += 1.0 - smoothstep(0.0, 0.05, s);
      d = min(d, s);
      coord += vec2(0.0, 0.2);
    }
    core /= 5.0;
    // 번짐: 줄기 바깥으로 부드럽게 줄어드는 빛
    float halo = exp(-max(d, 0.0) / max(uWidth, 1e-3));

    // 반짝임: 빗방울마다 다른 주기로 가끔 짧게 밝아진다
    float phase = uTime * (2.0 + vSeed * 5.0) + vSeed * 40.0;
    float blink = smoothstep(1.0 - 0.25 * uSparkle, 1.0, sin(phase) * 0.5 + 0.5) * uSparkle * 2.5;

    // 빛 받기: 등 가까이일수록 따뜻하게, 달 쪽을 바라볼 때(역광) 더 밝게
    vec3 toLamp = uLampPos - vWorld;
    float lamp = uLampIntensity * 0.12 / (1.0 + dot(toLamp, toLamp) * 0.6);
    vec3 viewDir = normalize(vWorld - cameraPosition);
    float moon = pow(max(dot(viewDir, uMoonDir), 0.0), 6.0) * 0.8;

    float light = 0.35 + lamp + moon + blink;
    vec3 tint = mix(uRainColor, uLampColor, clamp(lamp / (lamp + 0.35), 0.0, 1.0));

    // 중심에서 멀어질수록 옅게 (기존 빗방울과 같은 감쇠)
    float fade = clamp((8.5 - length(vWorld.xz)) / 8.5, 0.0, 1.0);
    // 안개 속으로 사라지게: 더하기 블렌딩이라 안개색을 섞지 않고 밝기만 줄인다
    float fog = 1.0 - smoothstep(fogNear, fogFar, vDepth);

    float intensity = (core + halo * uGlow * 0.6) * 0.5 * light * fade * fog;
    gl_FragColor = vec4(tint * intensity, 1.0);
  }
`;

// 매 프레임 실험실 값을 uniform으로 옮긴다
function updateUniforms(material: THREE.ShaderMaterial, time: number) {
  const n = useLab.getState().night;
  const u = material.uniforms;
  u.uTime.value = time;
  u.uGlow.value = n.rainGlow;
  u.uWidth.value = n.rainGlowWidth;
  u.uSparkle.value = n.rainSparkle;
  u.uLampPos.value.fromArray(n.lampPos);
  u.uLampColor.value.set(n.lampColor);
  u.uLampIntensity.value = n.lampIntensity;
}

/** 밤 씬 빗방울용 재질. Drops의 material로 넘긴다 */
export function useRainGlowMaterial() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
          uTime: { value: 0 },
          uGlow: { value: 1 },
          uWidth: { value: 0.6 },
          uSparkle: { value: 0.5 },
          uLampPos: { value: new THREE.Vector3() },
          uLampColor: { value: new THREE.Color() },
          uLampIntensity: { value: 0 },
          uMoonDir: { value: MOON_DIR },
          uRainColor: { value: new THREE.Color("#9fb2d6") },
        },
        fog: true, // fogNear/fogFar를 three가 채워 준다
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => updateUniforms(material, clock.elapsedTime));

  return material;
}
