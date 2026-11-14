import { useTexture } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { degToRad } from "three/src/math/MathUtils.js";
import { Drops } from "../Rain/Drops";
import { Splashes } from "../Rain/Splashes";
import { terrainLayout } from "../Night/terrain";

// 지형 가장자리가 사라지며 드러나는 색: 하늘 돔의 지평선 아래쪽(Night/Sky.tsx의 uTree, #03050a).
// 화면에 나가는 값 그대로 써야 하므로 색 공간 변환 없이 넣는다.
const EDGE_COLOR = new THREE.Color().setRGB(
  3 / 255,
  5 / 255,
  10 / 255,
  THREE.LinearSRGBColorSpace,
);

// size: 한 변 길이(m). 기존 씬은 15. 넓혀도 질감 밀도와 격자 간격은 terrainLayout이 유지한다.
// opaque: 반투명 대신 불투명으로 그린다 (밤 씬).
//   반투명 재질은 불투명 물체가 다 그려진 뒤에 섞이므로, 지형 뒤에 가려진 하늘 픽셀까지 전부 계산된다.
//   가장자리 뒤에 보이는 것은 어차피 어두운 지평선 아래 색 한 가지라서, 알파로 섞는 대신
//   그 색으로 직접 섞으면 결과는 같고 지형이 뒤의 픽셀을 가려 준다.
export function GroundBase({ size = 15, opaque = false, ...props }: any) {
  const { segments, repeat } = terrainLayout(size);
  const maps = useTexture([
    "textures/aerial_rocks_01_1k/aerial_rocks_01_diff_1k.jpg",
    "textures/aerial_rocks_01_1k/aerial_rocks_01_rough_1k.png",
    "textures/aerial_rocks_01_1k/aerial_rocks_01_nor_gl_1k.png",
    "textures/aerial_rocks_01_1k/aerial_rocks_01_disp_1k.png",
    "textures/aerial_rocks_01_1k/aerial_rocks_01_ao_1k.png",
  ]);

  const [alphaMap] = useTexture(["textures/alpha.jpg"]);

  useEffect(() => {
    // maps[0].colorSpace = THREE.SRGBColorSpace;

    [...maps].forEach((texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeat, repeat);
      texture.needsUpdate = true;
    });
  }, [maps, alphaMap, repeat]);

  const rockMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      transparent: !opaque,
      map: maps[0],
      metalness: 0.5,
      roughness: 0.2,
      roughnessMap: maps[1],
      aoMap: maps[4],
      normalMap: maps[2],
      alphaMap: alphaMap,
      alphaTest: 0.01,
      displacementMap: maps[3],
      displacementScale: 0.35,
      displacementBias: -0.12,
    });
    if (opaque) {
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uEdgeColor = { value: EDGE_COLOR };
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            "#include <common>\nuniform vec3 uEdgeColor;",
          )
          // 불투명 재질은 뒤에서 알파를 1로 덮어쓰므로 알파맵 값을 미리 챙겨 둔다
          .replace(
            "#include <alphatest_fragment>",
            "#include <alphatest_fragment>\nfloat edgeFade = diffuseColor.a;",
          )
          // 안개까지 끝난 최종 색을 가장자리 색과 섞는다 (반투명일 때 뒤 배경과 섞이던 것과 같은 식)
          .replace(
            "#include <fog_fragment>",
            "#include <fog_fragment>\ngl_FragColor.rgb = mix(uEdgeColor, gl_FragColor.rgb, edgeFade);",
          );
      };
      material.customProgramCacheKey = () => "ground-opaque-edge";
    }
    return material;
  }, [maps, alphaMap, opaque]);
  useEffect(() => () => rockMaterial.dispose(), [rockMaterial]);

  return (
    <group {...props}>
      <mesh
        rotation={[degToRad(-90), 0, 0]}
        material={rockMaterial}
        // 불투명일 때는 잔디·퍼걸러 다음에 그려서, 그 뒤에 가려진 비싼 PBR 픽셀을 깊이 테스트로 거른다
        renderOrder={opaque ? 10 : 0}
      >
        <planeGeometry args={[size, size, segments, segments]} />
      </mesh>
    </group>
  );
}

export function RainGround({ props }: any) {
  const [roughnessMap, dispMap] = useTexture([
    "textures/aerial_rocks_01_1k/aerial_rocks_01_rough_1k.png",
    "textures/aerial_rocks_01_1k/aerial_rocks_01_disp_1k.png",
  ]);

  const [alphaMap] = useTexture(["textures/alpha.jpg"]);

  useEffect(() => {
    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(2, 2);
    roughnessMap.needsUpdate = true;
  }, [roughnessMap]);

  return (
    <group {...props}>
      <mesh rotation={[degToRad(-90), 0, 0]}>
        <planeGeometry args={[17, 17, 1, 1]} />
        {/* <MeshReflectorMaterial
                roughnessMap={roughnessMap}
                // roughness={0.7}
                // normalMap={normalMap}
                color={'#544e4eff'}
                opacity={0.3}
                transparent={true}
                alphaMap={alphaMap}
                alphaTest={0.01}
                blur={[64, 64]} // Blur ground reflections (width, height), 0 skips blur
                mixBlur={1.1} // How much blur mixes with surface roughness (default = 1)
                mixStrength={10} // Strength of the reflections
                mixContrast={1.01} // Contrast of the reflections
                resolution={360} // Off-buffer resolution, lower=faster, higher=better quality, slower
                mirror={0.9} // Mirror environment, 0 = texture colors, 1 = pick up env colors
                depthScale={0} // Scale the depth factor (0 = no depth, default = 0)
                minDepthThreshold={0.9} // Lower edge for the depthTexture interpolation (default = 0)
                maxDepthThreshold={1} // Upper edge for the depthTexture interpolation (default = 0)
                depthToBlurRatioBias={0.25} // Adds a bias factor to the depthTexture before calculating the blur amount [blurFactor = blurTexture * (depthTexture + bias)]. It accepts values between 0 and 1, default is 0.25. An amount > 0 of bias makes sure that the blurTexture is not too sharp because of the multiplication with the depthTexture
                // distortion={0} // Amount of distortion based on the distortionMap texture
                // distortionMap={distortionTexture} // The red channel of this texture is used as the distortion map. Default is null
                reflectorOffset={0.2} // Offsets the virtual camera that projects the reflection. Useful when the reflective surface is some distance from the object's origin (default = 0)
            /> */}

        <meshStandardMaterial
          transparent={true}
          alphaMap={alphaMap}
          alphaTest={0.01}
          roughnessMap={roughnessMap}
          roughness={0.4}
          color={"#d0d0d0"}
          opacity={0.4}
          metalness={0.95}
          // displacementMap={dispMap}
          // displacementScale={0.2}
          // displacementBias={-0.1}
        />

        <Drops rotation={[degToRad(90), 0, 0]} />

        <Splashes count={200} rotation={[degToRad(90), 0, 0]}>
          <mesh position={[0, 0, 0.01]}>
            <circleGeometry args={[5, 32]} />
            <meshBasicMaterial color="white" transparent={true} opacity={0} />
          </mesh>
        </Splashes>
      </mesh>
    </group>
  );
}
