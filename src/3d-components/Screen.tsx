import Booting from "@/2d-components/Booting";
import Home from "@/2d-components/Home";
import { useCameraInit, useReady, useTweaks } from "@/stores";
import { Html } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useShallow } from "zustand/shallow";

type screenProps = React.JSX.IntrinsicElements["group"];

export default function Screen({ ...props }: screenProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const { setTarget, setCameraPos } = useCameraInit(
    useShallow((state) => ({
      setTarget: state.setTarget,
      setCameraPos: state.setPos,
    })),
  );
  const screenReady = useReady((state) => state.screenReady);
  const dive = useTweaks((state) => state.dive);

  // Get World position
  useEffect(() => {
    // Init camera target position
    const worldPosition = new THREE.Vector3();

    groupRef.current.updateWorldMatrix(true, false);
    groupRef.current.getWorldPosition(worldPosition);

    setTarget({
      x: worldPosition.x,
      y: worldPosition.y,
      z: worldPosition.z,
    });

    // Init camera position
    const direction = new THREE.Vector3();
    groupRef.current.getWorldDirection(direction);
    const cameraPos = worldPosition.add(direction.multiplyScalar(0.4));

    setCameraPos({
      x: cameraPos.x,
      y: cameraPos.y,
      z: cameraPos.z,
    });
  }, [groupRef]);

  return (
    <group ref={groupRef} {...props}>
      {/* <axesHelper /> */}
      <Html
        className={`w-[2560px] h-[1700px] overflow-hidden ${!dive && "rounded-4xl"} `}
        pointerEvents="none"
        {...(dive
          ? {
              fullscreen: true,
            }
          : {
              transform: true,
              distanceFactor: 0.069,
              occlude: "blending",
            })}
      >
        {screenReady ? <Home /> : <Booting />}
        {/* {screenReady ? 
                    <iframe className="w-full h-full" src="https://inpa.tistory.com/" />
                : <Booting />} */}
      </Html>
    </group>
  );
}
