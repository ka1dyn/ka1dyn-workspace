import * as THREE from "three";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";

// 커서가 잔디를 쓸고 지나간 흔적을 담는 "눌림 지도".
// 들판을 위에서 내려다본 작은 텍스처(rg = 잎이 눕는 방향 × 세기, 월드 xz 기준)를
// 두 장 번갈아 쓰며 매 프레임 갱신한다.
//   1) 지난 값의 세기를 일정한 속도로 줄인다 → 잎이 천천히 다시 선다
//   2) 커서가 이번 프레임에 지나간 선분 주변에 커서의 이동 방향을 더한다 → 움직인 쪽으로 눕는다
// 잔디 셰이더는 잎 뿌리 위치에서 이 값을 읽어 휘는 각도에 더한다.

const SIZE = 256;

const fragmentShader = /* glsl */ `
  uniform sampler2D uPrev;
  uniform float uExtent;   // 텍스처가 덮는 월드 한 변 (m)
  uniform vec2 uFrom;      // 지난 프레임 커서 (월드 xz)
  uniform vec2 uTo;        // 이번 프레임 커서
  uniform vec2 uDir;       // 커서 이동 방향 (단위 벡터)
  uniform float uStamp;    // 이번 프레임에 더할 세기 (움직이지 않으면 0)
  uniform float uRadius;   // 커서 반경 (m)
  uniform float uRecover;  // 이번 프레임에 줄일 세기 (dt / 회복 시간)
  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * uExtent;

    // 1) 회복: 방향은 그대로 두고 세기만 일정하게 줄인다 (지수 감쇠보다 끝까지 꾸준히 일어선다)
    vec2 v = texture2D(uPrev, vUv).rg;
    float len = length(v);
    v = len > 1e-5 ? v * max(len - uRecover, 0.0) / len : vec2(0.0);

    // 2) 커서가 지나간 선분까지의 거리로 반경 안에 이동 방향을 더한다
    vec2 ab = uTo - uFrom;
    float t = clamp(dot(p - uFrom, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
    float d = length(p - (uFrom + ab * t));
    float near = 1.0 - smoothstep(uRadius * 0.25, uRadius, d);
    v += uDir * near * uStamp;

    // 세기는 1을 넘지 않게
    float l = length(v);
    if (l > 1.0) v /= l;
    gl_FragColor = vec4(v, 0.0, 1.0);
  }
`;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

function createTarget() {
  return new THREE.WebGLRenderTarget(SIZE, SIZE, {
    type: THREE.HalfFloatType, // 방향이 음수도 되므로 부호 있는 실수
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  });
}

export class InteractionMap {
  private read = createTarget();
  private write = createTarget();
  private readonly material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uPrev: { value: null },
      uExtent: { value: 1 },
      uFrom: { value: new THREE.Vector2() },
      uTo: { value: new THREE.Vector2() },
      uDir: { value: new THREE.Vector2() },
      uStamp: { value: 0 },
      uRadius: { value: 1 },
      uRecover: { value: 0 },
    },
    depthTest: false,
    depthWrite: false,
  });
  private readonly quad = new FullScreenQuad(this.material);

  /** 잔디 셰이더가 읽을 텍스처 */
  get texture() {
    return this.read.texture;
  }

  update(
    renderer: THREE.WebGLRenderer,
    p: {
      extent: number;
      from: THREE.Vector2;
      to: THREE.Vector2;
      dir: THREE.Vector2;
      stamp: number;
      radius: number;
      recover: number;
    },
  ) {
    const u = this.material.uniforms;
    u.uPrev.value = this.read.texture;
    u.uExtent.value = p.extent;
    u.uFrom.value.copy(p.from);
    u.uTo.value.copy(p.to);
    u.uDir.value.copy(p.dir);
    u.uStamp.value = p.stamp;
    u.uRadius.value = p.radius;
    u.uRecover.value = p.recover;

    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(this.write);
    this.quad.render(renderer);
    renderer.setRenderTarget(prev);
    [this.read, this.write] = [this.write, this.read];
  }

  dispose() {
    this.read.dispose();
    this.write.dispose();
    this.material.dispose();
    this.quad.dispose();
  }
}
