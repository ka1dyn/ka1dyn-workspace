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
  uniform float uLane;  // 암흑대(어두운 먼지 줄무늬) 세기
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

    // 별구름: 큰 덩어리 + 잔 알갱이 (덩어리 대비를 키워 암흑대와 대비가 나게)
    float clouds = fbm(d * 5.0, 6);
    float grain = fbm(d * 24.0, 4);
    float intensity = band * (0.2 + 1.4 * pow(clouds, 2.5)) + core * 0.6 * (0.4 + grain);

    // 띠 기준 좌표: 띠를 따라가는 각도(along)와 띠에서 떨어진 정도(b).
    // 노이즈를 이 좌표로 계산하면 띠를 따라 길게 흐르는 줄무늬가 된다.
    // (원 위의 cos·sin으로 넣어 각도가 한 바퀴 돌아도 이음매가 없다)
    vec3 e1 = normalize(cross(uNormal, abs(uNormal.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
    vec3 e2 = cross(uNormal, e1);
    float along = atan(dot(d, e2), dot(d, e1));
    vec3 q = vec3(cos(along) * 5.0, sin(along) * 5.0, b * 38.0);

    // 굵은 암흑대: 띠 중심 근처를 따라 길게 흐르는 어두운 줄기
    float lane = smoothstep(0.42, 0.64, fbm(q + 3.1, 5)) * exp(-b * b / (0.11 * 0.11));
    // 가는 먼지 가닥: 더 촘촘한 노이즈로 띠를 가로지르는 가는 어두운 가닥
    float fil = smoothstep(0.55, 0.74, fbm(q * vec3(2.6, 2.6, 1.7) + 9.4, 4)) * exp(-b * b / (0.15 * 0.15));
    intensity *= 1.0 - uLane * clamp(lane * 0.92 + fil * 0.3, 0.0, 0.95);

    // 색: 바깥은 푸른 회색, 중심부는 아주 약하게 따뜻한 색
    vec3 color = mix(vec3(0.55, 0.63, 0.86), vec3(0.95, 0.86, 0.74), core * 0.55);
    gl_FragColor = vec4(color * intensity, band);
  }
`;

/** 은하수 텍스처를 한 번 굽는다. 돌려준 렌더 타깃은 쓰는 쪽에서 dispose한다 */
export function bakeMilkyWay(
  renderer: THREE.WebGLRenderer,
  normal: THREE.Vector3,
  lane = 1,
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
    uniforms: {
      uNormal: { value: normal.clone().normalize() },
      uLane: { value: lane },
    },
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
