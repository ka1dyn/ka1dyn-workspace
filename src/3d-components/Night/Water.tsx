import { useLab } from "@/lab/store";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { GRASS_LAYER, REFLECT_LAYER } from "./constants";
import { getWindTexture } from "./noise";
import { PlanarReflection } from "./PlanarReflection";
import { TERRAIN, useTerrainTextures } from "./terrain";

// 돌 지형 위에 까는 수면 평면. 지형보다 낮은 곳에서만 보여서 그 자리가 곧 물웅덩이가 된다
// (높은 바위는 깊이 테스트로 수면을 가린다). 지형과 같은 그룹·크기·회전이라 UV가 같으므로
// 지형의 알파맵으로 가장자리를 함께 흐리고, 변위맵으로 물 깊이를 구해 얕은 물가를 투명하게 한다.

const vertexShader = /* glsl */ `
  #include <fog_pars_vertex>
  uniform mat4 uTextureMatrix;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec4 vReflection;

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vReflection = uTextureMatrix * world;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  #include <fog_pars_fragment>
  uniform sampler2D uAlpha;
  uniform sampler2D uDisp;
  uniform sampler2D uNoise;
  uniform sampler2D uReflection;
  uniform float uLevel;
  uniform float uDispScale;
  uniform float uDispBias;
  uniform float uBaseY;
  uniform float uRepeat;
  uniform float uTime;
  uniform vec3 uWaterTint;
  uniform vec3 uDeepColor;
  uniform vec3 uSkyColor;
  uniform vec3 uLampPos;
  uniform vec3 uLampColor;
  uniform float uLampIntensity;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec4 vReflection;

  #if RIPPLE_R > 0
  // 빗방울 파문 (기존 MirrorMaterial의 getRipples). 칸마다 하나씩 퍼지는 원을 주변 (2R+1)² 칸에서 모은다.
  vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.xx + p3.yz) * p3.zy);
  }
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
  }
  vec2 ripples(vec2 uv) {
    vec2 p0 = floor(uv);
    float time = uTime * 1.6;
    vec2 circles = vec2(0.0);
    for (int j = -RIPPLE_R; j <= RIPPLE_R; ++j) {
      for (int i = -RIPPLE_R; i <= RIPPLE_R; ++i) {
        vec2 pi = p0 + vec2(i, j);
        vec2 p = pi + hash22(pi);
        float t = fract(0.3 * time + hash12(pi));
        vec2 v = p - uv;
        float d = length(v) - (float(RIPPLE_R) + 1.0) * t;
        float h = 1e-3;
        float d1 = d - h;
        float d2 = d + h;
        float p1 = sin(31.0 * d1) * smoothstep(-0.6, -0.3, d1) * smoothstep(0.0, -0.3, d1);
        float p2 = sin(31.0 * d2) * smoothstep(-0.6, -0.3, d2) * smoothstep(0.0, -0.3, d2);
        circles += 0.5 * normalize(v) * ((p2 - p1) / (2.0 * h) * (1.0 - t) * (1.0 - t));
      }
    }
    return circles / float((RIPPLE_R * 2 + 1) * (RIPPLE_R * 2 + 1));
  }
  #endif

  void main() {
    // 지형 알파맵: 지형과 같은 UV라 가장자리가 같이 사라진다
    float edge = texture2D(uAlpha, vUv).r;
    if (edge < 0.01) discard;

    // 물 깊이 = 수면 높이 - 지형 높이. 지형은 128칸 꼭짓점에서만 변위를 읽으므로
    // 흐린 밉 단계를 읽어 메시의 부드러운 높이에 가깝게 맞춘다.
    float ground = textureLod(uDisp, vUv * uRepeat, 4.0).r * uDispScale + uDispBias + uBaseY;
    float depth = uLevel - ground;
    float deep = smoothstep(0.0, 0.015, depth);

    // 바람에 이는 잔물결 + 빗방울 파문
    vec2 n = texture2D(uNoise, vWorld.xz * 0.25 + uTime * vec2(0.02, 0.013)).rg - 0.5;
    vec2 offset = n * 0.012;
    #if RIPPLE_R > 0
      offset += ripples(vWorld.xz * 6.0) * 0.06;
    #endif

    vec3 viewDir = normalize(cameraPosition - vWorld);
    float fresnel = 0.5 + 0.5 * pow(1.0 - clamp(viewDir.y, 0.0, 1.0), 3.0);

    #ifdef REFLECTION
      vec2 uv = vReflection.xy / vReflection.w + offset;
      #ifdef BLUR
        // 많이 흔들리는 곳일수록 흐린 밉 단계를 읽는다
        vec3 refl = textureLod(uReflection, uv, 1.0 + length(offset) * 60.0).rgb;
      #else
        vec3 refl = texture2D(uReflection, uv).rgb;
      #endif
    #else
      vec3 refl = uSkyColor * (1.0 + length(offset) * 8.0);
    #endif

    // 밤이라 반사가 원래 어둡다. 물로 읽히도록 반사를 조금 밝혀 섞는다.
    vec3 color = mix(uDeepColor, refl * uWaterTint * 2.0, fresnel);
    // 등 아래 수면에 번지는 따뜻한 빛
    vec3 l = uLampPos - vWorld;
    color += uLampColor * uLampIntensity * 0.02 / (1.0 + dot(l.xz, l.xz) * 0.8);

    // 얕은 물가는 투명하게 해서 젖은 돌이 비쳐 보이게 한다
    float alpha = edge * mix(0.6, 0.95, deep);
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

interface WaterProps {
  reflection: boolean;
  reflectionRes: number;
  blur: boolean;
  grassInReflection: boolean;
  rippleRadius: number;
}

export default function Water({
  reflection,
  reflectionRes,
  blur,
  grassInReflection,
  rippleRadius,
}: WaterProps) {
  const mesh = useRef<THREE.Mesh>(null!);
  const size = useThree((s) => s.size);
  const { disp, alpha } = useTerrainTextures();

  const planar = useMemo(() => new PlanarReflection(0), []);

  // 반사 타깃: 어두운 밤 색이 계단지지 않도록 HalfFloat. 흐림은 하드웨어 밉맵으로 만든다.
  const target = useMemo(() => {
    if (!reflection) return null;
    return new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      generateMipmaps: blur,
      minFilter: blur ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
    });
  }, [reflection, blur]);
  useEffect(() => () => target?.dispose(), [target]);

  useLayoutEffect(() => {
    target?.setSize(
      Math.max(1, Math.round(size.width * reflectionRes)),
      Math.max(1, Math.round(size.height * reflectionRes)),
    );
  }, [target, size, reflectionRes]);

  const material = useMemo(() => {
    const defines: Record<string, string | number> = { RIPPLE_R: rippleRadius };
    if (reflection) defines.REFLECTION = "";
    if (reflection && blur) defines.BLUR = "";
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      fog: true,
      transparent: true,
      depthWrite: false,
      defines,
      uniforms: {
        ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
        uAlpha: { value: alpha },
        uDisp: { value: disp },
        uNoise: { value: getWindTexture() },
        uReflection: { value: null },
        uTextureMatrix: { value: planar.textureMatrix },
        uLevel: { value: 0 },
        uDispScale: { value: TERRAIN.dispScale },
        uDispBias: { value: TERRAIN.dispBias },
        uBaseY: { value: TERRAIN.y },
        uRepeat: { value: TERRAIN.repeat },
        uTime: { value: 0 },
        uWaterTint: { value: new THREE.Color("#c4cfe6") },
        uDeepColor: { value: new THREE.Color("#030508") },
        uSkyColor: { value: new THREE.Color("#16213d") },
        uLampPos: { value: new THREE.Vector3() },
        uLampColor: { value: new THREE.Color() },
        uLampIntensity: { value: 0 },
      },
    });
  }, [reflection, blur, rippleRadius, planar, disp, alpha]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ gl, scene, camera, clock }) => {
    const n = useLab.getState().night;
    // 재질은 메시에서 꺼내 쓴다 (useMemo 값을 직접 고치면 React 컴파일러 규칙에 걸린다)
    const u = (mesh.current.material as THREE.ShaderMaterial).uniforms;
    u.uTime.value = clock.elapsedTime;
    u.uLevel.value = n.waterLevel;
    u.uLampPos.value.fromArray(n.lampPos);
    u.uLampColor.value.set(n.lampColor);
    u.uLampIntensity.value = n.lampIntensity;
    mesh.current.position.y = n.waterLevel;

    if (!target) return;
    planar.setHeight(n.waterLevel);
    if (!planar.update(camera as THREE.PerspectiveCamera)) return;

    // 반사 카메라는 반사 레이어(하늘·달·지형·퍼걸러·맥북 몸체·조명)만 그린다.
    // drei Html의 occlusion 평면은 이 레이어에 없으므로 반사에 구멍이 생기지 않는다.
    planar.camera.layers.set(REFLECT_LAYER);
    if (grassInReflection) planar.camera.layers.enable(GRASS_LAYER);

    mesh.current.visible = false;
    const prev = gl.getRenderTarget();
    gl.setRenderTarget(target);
    gl.clear();
    gl.render(scene, planar.camera);
    gl.setRenderTarget(prev);
    mesh.current.visible = true;
    u.uReflection.value = target.texture;
  });

  return (
    // 지형과 같은 회전. 지형 그룹의 y 위치(-0.03)는 수면 높이에 영향이 없도록 따르지 않는다.
    <group rotation={[0, TERRAIN.rotY, 0]}>
      <mesh
        ref={mesh}
        material={material}
        rotation={[-Math.PI / 2, 0, 0]}
        // 반투명 지형 다음에 그려서 지형 깊이로 가려지게 한다
        renderOrder={1}
      >
        <planeGeometry args={[TERRAIN.size, TERRAIN.size]} />
      </mesh>
    </group>
  );
}
