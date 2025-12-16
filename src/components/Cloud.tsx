import * as drei from "@react-three/drei";
import * as THREE from "three";
import { random } from "maath"
import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
// import { isDesktop } from "react-device-detect";

export function Clouds() {
  const lightRef = useRef<THREE.DirectionalLight>(null!)

  // drei.useHelper(lightRef, THREE.DirectionalLightHelper, 0.2, 'cyan')

  const [flash] = useState(() => new random.FlashGen({ count: 6, minDuration: 40, maxDuration: 200, minInterval: 10000, maxInterval: 30000 }))

  useFrame((state, delta) => {
    let impulse = flash.update(state.clock.elapsedTime, delta)
    console.log(impulse)
    if(impulse > 0) {
      impulse = Math.random() * 3 + 2
    }
    lightRef.current.intensity = impulse
  })

  return (
    <>
      <pointLight
        ref={lightRef}
        color="#d4d0ff"
        intensity={0}
        decay={0.3}
        position={[0, 10, 0]} />
      <drei.Clouds 
        limit={200} 
        material={THREE.MeshLambertMaterial}>

        <drei.Cloud
          bounds={[1, 5, 5]}
          segments={10}
          position={[-10, 2, 0]}
          color="#7d7d7d"
          opacity={0.3}
        />
        <drei.Cloud
          bounds={[1, 5, 5]}
          position={[10, 2, 0]}
          color="#7d7d7d"
          opacity={0.3}
        />
        <drei.Cloud
          bounds={[1, 5, 1]}
          position={[0, 2, 10]}
          color="#7d7d7d"
          opacity={0.3}
        />
        <drei.Cloud
          bounds={[1, 5, 1]}
          position={[0, 2, -10]}
          color="#7d7d7d"
          opacity={0.3}
        />
      </drei.Clouds>

      
    </>
  );
}
