import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Cloud, Clouds } from "@react-three/drei";
import { PUBLIC_IMAGES } from "@/shared/constants/images";
// import { isDesktop } from "react-device-detect";

// 구름 모델만 그린다. 번개(섬광·천둥)는 Lightning.tsx로 옮겨 구름과 따로 켜고 끈다.
export function RainClouds() {
  const cloudRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    // Cloud rotation
    if (cloudRef.current) {
      cloudRef.current.rotation.y += 0.05 * delta;
    }
  });

  const { ...config } = {
    seed: 1,
    segments: 30,
    volume: 6,
    opacity: 0.4,
    fade: 20,
    growth: 3,
    speed: 0.5,
    color: "#868686",
  };

  return (
    <Clouds
      ref={cloudRef}
      limit={200}
      material={THREE.MeshLambertMaterial}
      texture={PUBLIC_IMAGES.CLOUD}
    >
      <Cloud {...config} bounds={[2, 2, 4]} position={[-9, 5, 0]} />
      <Cloud
        {...config}
        seed={2}
        segments={20}
        bounds={[2, 1, 2]}
        position={[8, 4, -4]}
      />
      {/* <Cloud
        {...config}
        seed={3}
        segments={20}
        bounds={[4, 2, 1]}
        position={[4, 4, 9]}
      /> */}
      {/* <Cloud
        bounds={[1, 5, 1]}
        position={[0, 2, -10]}
        color="#7d7d7d"
        opacity={0.3}
      /> */}
    </Clouds>
  );
}
