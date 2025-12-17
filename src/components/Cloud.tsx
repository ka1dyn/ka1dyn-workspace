import * as THREE from "three";
import { random } from "maath"
import { useCallback, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Cloud, Clouds } from "@react-three/drei";
import { useSound } from "./Sound";
// import { isDesktop } from "react-device-detect";

export function RainClouds() {
  const lightRef = useRef<THREE.DirectionalLight>(null!)
  const [flash] = useState(() => new random.FlashGen({ count: 8, minDuration: 40, maxDuration: 200, minInterval: 10000, maxInterval: 25000 }))
  
  const {soundRef, isReady} = useSound('audio/thunder.mp3')
  
  const playThunder = useCallback(() => {
    const thunder = soundRef.current
    if(!isReady) {
      return
    }

    const thundertype = [
      {start: 4, end: 12},
      {start: 18, end: 26},
      {start: 28, end: 33}
    ]

    const playType = thundertype[Math.floor(Math.random() * 3)]

    thunder.offset = playType.start
    thunder.duration = playType.end - playType.start
    
    const delay = Math.random() * 3 + 1
    thunder.play(delay)
  }, [isReady])

  const prevCnt = useRef<number>(0);
  useFrame((state, delta) => {
    let impulse = flash.update(state.clock.elapsedTime, delta)
    if(impulse > 0) {
      impulse = Math.random() * 3 + 2
    }
    lightRef.current.intensity = impulse

    // Lightning sound reservation
    if (flash.currentCount != 0 && prevCnt.current == 0) {
      playThunder()
    }

    prevCnt.current = flash.currentCount;
  })

  return (
    <>
      <pointLight
        ref={lightRef}
        color="#d4d0ff"
        intensity={0}
        decay={0.3}
        position={[0, 10, 0]} />
      <Clouds 
        limit={200} 
        material={THREE.MeshLambertMaterial}>

        <Cloud
          bounds={[1, 5, 5]}
          segments={10}
          position={[-10, 2, 0]}
          color="#7d7d7d"
          opacity={0.3}
        />
        <Cloud
          bounds={[1, 5, 5]}
          position={[10, 2, 0]}
          color="#7d7d7d"
          opacity={0.3}
        />
        <Cloud
          bounds={[1, 5, 1]}
          position={[0, 2, 10]}
          color="#7d7d7d"
          opacity={0.3}
        />
        <Cloud
          bounds={[1, 5, 1]}
          position={[0, 2, -10]}
          color="#7d7d7d"
          opacity={0.3}
        />
      </Clouds>

      
    </>
  );
}
