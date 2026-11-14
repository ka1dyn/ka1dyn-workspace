import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";

// 은하수: 시작할 때 GPU로 한 번만 등장방형(equirect) 텍스처에 굽는다.
// 매 픽셀 FBM 여러 겹은 비싸서, 하늘 셰이더는 이 텍스처를 한 번만 읽는다.
// rgb = 은하수 색, a = 띠 밀도(하늘 셰이더가 띠 안의 별을 늘리는 데 쓴다).
// 노이즈를 방향(3D) 기준으로 계산해서 경도 이음매가 생기지 않는다.

const WIDTH = 2048;
const HEIGHT = 1024;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uNormal; // 은하수 대원(띠 중심선)이 놓인 평면의 법선
  varying vec2 vUv;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0, 0, 0)), hash(i + vec3(1, 0, 0)), f.x),
                   mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
                   mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p, int octaves) {
    float sum = 0.0;
    float amp = 0.5;
    float norm = 0.0;
    for (int o = 0; o < 6; o++) {
      if (o >= octaves) break;
      sum += noise(p) * amp;
      norm += amp;
      p *= 2.03;
      amp *= 0.5;
    }
    return sum / norm;
  }

  void main() {
    // 텍스처 좌표 → 방향. 하늘 셰이더의 읽기(atan(d.z, d.x), asin(d.y))와 짝을 맞춘다
    float lon = (vUv.x - 0.5) * 6.2831853;
    float lat = (vUv.y - 0.5) * 3.1415927;
    vec3 d = vec3(cos(lat) * cos(lon), sin(lat), cos(lat) * sin(lon));

    // 띠 중심선(대원)에서 떨어진 정도. 노이즈로 굽이치게 한다
    float b = dot(d, uNormal);
    b += (fbm(d * 2.5 + 7.0, 4) - 0.5) * 0.14;

    float band = exp(-b * b / (0.17 * 0.17));  // 넓은 띠
    float core = exp(-b * b / (0.055 * 0.055)); // 밝은 중심부

    // 별구름: 큰 덩어리 + 잔 알갱이
    float clouds = fbm(d * 5.0, 6);
    float grain = fbm(d * 24.0, 4);
    float intensity = band * (0.25 + 1.1 * clouds * clouds) + core * 0.55 * (0.4 + grain);

    // 암흑대: 중심을 따라 길게 흐르는 어두운 줄무늬
    float lane = smoothstep(0.48, 0.72, fbm(d * vec3(9.0, 4.0, 9.0) + 3.1, 5));
    intensity *= 1.0 - lane * 0.85 * exp(-b * b / (0.08 * 0.08));

    // 색: 바깥은 푸른 회색, 중심부는 아주 약하게 따뜻한 색
    vec3 color = mix(vec3(0.55, 0.63, 0.86), vec3(0.95, 0.86, 0.74), core * 0.55);
    gl_FragColor = vec4(color * intensity, band);
  }
`;

/** 은하수 텍스처를 한 번 굽는다. 돌려준 렌더 타깃은 쓰는 쪽에서 dispose한다 */
export function bakeMilkyWay(
  renderer: THREE.WebGLRenderer,
  normal: THREE.Vector3,
) {
  const target = new THREE.WebGLRenderTarget(WIDTH, HEIGHT, {
    type: THREE.HalfFloatType, // 어두운 그라데이션이 계단지지 않게
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.RepeatWrapping,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  });
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { uNormal: { value: normal.clone().normalize() } },
    depthTest: false,
    depthWrite: false,
  });
  const quad = new FullScreenQuad(material);
  const prev = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  quad.render(renderer);
  renderer.setRenderTarget(prev);
  quad.dispose();
  material.dispose();
  return target;
}
