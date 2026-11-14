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

    // 띠를 따라가는 각도(along). 원 위의 cos·sin으로 노이즈에 넣어 한 바퀴 돌아도 이음매가 없다
    vec3 e1 = normalize(cross(uNormal, abs(uNormal.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
    vec3 e2 = cross(uNormal, e1);
    float along = atan(dot(d, e2), dot(d, e1));
    vec3 ring = vec3(cos(along), sin(along), 0.0);

    // 도메인 워핑: 노이즈 좌표를 다른 노이즈로 비틀어 줄무늬 대신 일렁이는 유기적인 모양을 만든다
    vec3 warp = vec3(fbm(d * 3.0 + 1.7, 4), fbm(d * 3.0 + 8.3, 4), fbm(d * 3.0 + 4.1, 4)) - 0.5;
    vec3 dw = d + warp * 0.22;

    // 중심 균열(rift): 띠 가운데를 따라 굽이치는 어두운 틈. 위치·폭이 띠를 따라 변하고 군데군데 끊긴다
    float riftOff = (fbm(ring * 3.0 + 2.0, 3) - 0.5) * 0.09;
    float riftW = 0.018 + 0.04 * fbm(ring * 4.0 + vec3(0.0, 0.0, 6.0), 3);
    float rb = (b - riftOff) / riftW;
    float rift = exp(-rb * rb) * smoothstep(0.38, 0.62, fbm(dw * 6.0 + 5.0, 4));

    // 얼룩진 암흑 성운: 띠 위에 불규칙한 덩어리로 흩어진 어두운 구름
    float mottled = smoothstep(0.5, 0.72, fbm(dw * 9.0 + 11.0, 5)) * exp(-b * b / (0.13 * 0.13));

    intensity *= 1.0 - uLane * clamp(rift * 0.85 + mottled * 0.6, 0.0, 0.92);

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
