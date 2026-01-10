import * as THREE from "three";
import { random } from "maath";
import { useCallback, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Cloud, Clouds } from "@react-three/drei";
import { useSound } from "./Sound";
import { useStart } from "@/stores";
// import { isDesktop } from "react-device-detect";

export function RainClouds() {
  const lightRef = useRef<THREE.DirectionalLight>(null!);
  const cloudRef = useRef<THREE.Group>(null!);
  const [flash] = useState(
    () =>
      new random.FlashGen({
        count: 8,
        minDuration: 40,
        maxDuration: 200,
        minInterval: 10000,
        maxInterval: 25000,
      }),
  );
  const start = useStart((state) => state.start);

  const { soundRef, isReady } = useSound("audio/thunder.mp3");

  const playThunder = useCallback(() => {
    const thunder = soundRef.current;
    if (!isReady || !start) {
      return;
    }

    const thundertype = [
      { start: 4, end: 12 },
      { start: 18, end: 26 },
      { start: 28, end: 33 },
    ];

    const playType = thundertype[Math.floor(Math.random() * 3)];

    thunder.offset = playType.start;
    thunder.duration = playType.end - playType.start;

    const delay = Math.random() * 2 + 0.5;
    thunder.play(delay);
  }, [isReady, start]);

  const prevCnt = useRef<number>(0);
  useFrame((state, delta) => {
    // Lightning
    let impulse = flash.update(state.clock.elapsedTime, delta);
    if (impulse > 0) {
      impulse = Math.random() * 4 + 2.5;
    }
    lightRef.current.intensity = impulse;

    // Lightning sound reservation
    if (flash.currentCount != 0 && prevCnt.current == 0) {
      playThunder();
    }

    prevCnt.current = flash.currentCount;

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
    <>
      <pointLight
        ref={lightRef}
        color="#d4d0ff"
        intensity={0}
        decay={0.3}
        position={[0, 10, 0]}
      />
      <Clouds ref={cloudRef} limit={200} material={THREE.MeshLambertMaterial}>
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
    </>
  );
}
