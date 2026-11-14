import { useMemo } from "react";
import * as THREE from "three";
import { MOON_DIR } from "./constants";

// 하늘 돔: 조명 계산 없이 방향만으로 색을 정한다.
// 세로 그라데이션 + 달 원판과 번짐 + 지평선 숲 실루엣 + 희미한 별.
// 달 번짐을 Bloom 후처리 대신 여기서 그려 전체 화면 패스를 늘리지 않는다.
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
  varying vec3 vDir;

  float hash(float n) { return fract(sin(n) * 43758.5453); }
  float noise1(float x) {
    float i = floor(x);
    float f = fract(x);
    return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;

    vec3 color = mix(uHorizon, uZenith, smoothstep(-0.05, 0.6, h));

    // 별: 방향을 격자로 나눠 칸마다 확률적으로 점 하나
    vec3 cell = floor(d * 180.0);
    float star = step(0.9975, fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453));
    color += star * smoothstep(0.1, 0.5, h) * 0.6;

    // 달 원판과 두 겹 번짐
    float c = dot(d, uMoonDir);
    float disk = smoothstep(0.99955, 0.99975, c);
    float halo = pow(max(c, 0.0), 600.0) * 0.5 + pow(max(c, 0.0), 40.0) * 0.08;
    color += uMoon * (disk * 2.0 + halo);

    // 지평선 숲: 방위각에 따라 높이가 변하는 실루엣
    float az = atan(d.z, d.x);
    float tree = 0.035 + 0.05 * noise1(az * 18.0) + 0.03 * noise1(az * 55.0) + 0.02 * noise1(az * 140.0);
    color = mix(color, uTree, step(h, tree));

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

export default function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uMoonDir: { value: MOON_DIR },
          uZenith: { value: new THREE.Color("#02040b") },
          uHorizon: { value: new THREE.Color("#16213d") },
          uTree: { value: new THREE.Color("#03050a") },
          uMoon: { value: new THREE.Color("#e8eeff") },
        },
      }),
    [],
  );

  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[40, 48, 24]} />
    </mesh>
  );
}
