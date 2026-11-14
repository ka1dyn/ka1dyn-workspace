import { useLab } from "@/lab/store";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

// 필름 그레인. 후처리 패스(렌더 타깃에 그리고 다시 읽어 복사)를 만들지 않고,
// 장면을 다 그린 뒤 화면을 덮는 삼각형 하나를 마지막에 그려 GPU 블렌딩으로 섞는다.
//   - 렌더 타깃·화면 복사 없음, 텍스처 읽기 없음 (노이즈는 픽셀 좌표 해시)
//   - 블렌딩: 결과 = 2 × 노이즈 × 화면색 (modulate 2x). 노이즈 0.5가 "변화 없음"이라
//     밝기를 위아래로 고르게 흔들고 화면이 회색으로 뜨지 않는다.
//   - 어두운 곳 그레인: 곱하기는 어두운 곳에서 거의 안 보이므로, 같은 노이즈를 밝기와 무관한
//     고정 폭으로 더하고 뺀다. 블렌딩 값은 음수가 될 수 없어서 음수 쪽은 빼기, 양수 쪽은 더하기로
//     한 번씩 더 그린다 (삼각형 3번, 렌더 타깃·텍스처 없음).
//   - 메시는 레이어 0에만 있어 물웅덩이 반사(레이어 1)에는 그려지지 않는다.

const vertexShader = /* glsl */ `
  void main() {
    // 카메라와 무관하게 화면을 덮는 큰 삼각형 (정점 3개)
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uAmount;  // 그레인 세기 (밝기 변화 폭)
  uniform float uSize;    // 입자 크기 (화면 픽셀)
  uniform float uSeed;    // 초당 24번 바뀌는 값
  uniform float uDark;    // 어두운 곳 그레인: 밝기와 무관하게 더하고 빼는 폭

  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void main() {
    vec2 cell = floor(gl_FragCoord.xy / uSize);
    // 균일 분포 두 개의 평균: 가운데가 두꺼워 거친 점이 줄고 필름 입자처럼 보인다
    float n = (hash(cell + uSeed) + hash(cell.yx + uSeed * 1.37 + 17.0)) * 0.5 - 0.5;
    #if MODE == 0
      // 곱하기: 0.5 ± 세기 → modulate 2x 블렌딩에서 화면색 × (1 ± 2·세기·n)
      gl_FragColor = vec4(vec3(0.5 + n * uAmount), 0.5);
    #elif MODE == 1
      // 빼기 (노이즈가 음수인 곳): 화면색 - 폭·|n|·2
      gl_FragColor = vec4(vec3(max(-n, 0.0) * 2.0 * uDark), 0.0);
    #else
      // 더하기 (노이즈가 양수인 곳): 화면색 + 폭·n·2
      gl_FragColor = vec4(vec3(max(n, 0.0) * 2.0 * uDark), 0.0);
    #endif
  }
`;

export default function Grain() {
  const enabled = useLab((s) => s.night.grain);
  const group = useRef<THREE.Group>(null!);
  const dark = useLab((s) => s.night.grainDark > 0);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
    );
    return g;
  }, []);

  const materials = useMemo(() => {
    const make = (
      mode: number,
      blend: Partial<THREE.ShaderMaterialParameters>,
    ) =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        defines: { MODE: mode },
        uniforms: {
          uAmount: { value: 0.1 },
          uSize: { value: 1.5 },
          uSeed: { value: 0 },
          uDark: { value: 0 },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        ...blend,
      });
    return [
      // modulate 2x: src × dst + dst × src = 2·src·dst (알파도 2·0.5·dst = dst 로 그대로)
      make(0, {
        blendSrc: THREE.DstColorFactor,
        blendDst: THREE.SrcColorFactor,
        blendSrcAlpha: THREE.DstAlphaFactor,
        blendDstAlpha: THREE.SrcAlphaFactor,
      }),
      // 빼기: dst - src
      make(1, {
        blendEquation: THREE.ReverseSubtractEquation,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        blendSrcAlpha: THREE.ZeroFactor,
        blendDstAlpha: THREE.OneFactor,
      }),
      // 더하기: dst + src
      make(2, {
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        blendSrcAlpha: THREE.ZeroFactor,
        blendDstAlpha: THREE.OneFactor,
      }),
    ];
  }, []);
  useEffect(
    () => () => {
      geometry.dispose();
      materials.forEach((m) => m.dispose());
    },
    [geometry, materials],
  );

  useFrame(({ clock }) => {
    if (!enabled) return;
    const n = useLab.getState().night;
    // 초당 24번만 바꿔 필름처럼 보이게 하고 지글거림을 줄인다
    const seed = (Math.floor(clock.elapsedTime * 24) % 1000) * 0.618;
    // 재질은 메시에서 꺼내 쓴다 (useMemo 값을 직접 고치면 React 컴파일러 규칙에 걸린다)
    group.current.children.forEach((child) => {
      const u = ((child as THREE.Mesh).material as THREE.ShaderMaterial)
        .uniforms;
      u.uAmount.value = n.grainAmount;
      u.uSize.value = n.grainSize;
      u.uSeed.value = seed;
      u.uDark.value = n.grainDark;
    });
  });

  if (!enabled) return null;
  // 투명 물체 중 맨 마지막에 그려서 장면 전체 위에 섞인다 (곱하기 → 빼기 → 더하기 순)
  return (
    <group ref={group}>
      <mesh
        geometry={geometry}
        material={materials[0]}
        frustumCulled={false}
        renderOrder={1e6}
      />
      {dark && (
        <>
          <mesh
            geometry={geometry}
            material={materials[1]}
            frustumCulled={false}
            renderOrder={1e6 + 1}
          />
          <mesh
            geometry={geometry}
            material={materials[2]}
            frustumCulled={false}
            renderOrder={1e6 + 2}
          />
        </>
      )}
    </group>
  );
}
