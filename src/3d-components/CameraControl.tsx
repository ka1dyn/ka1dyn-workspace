import { useCameraInit, useTweaks } from "@/stores";
import { useShallow } from "zustand/shallow";
import { useEffect, useRef } from "react";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { degToRad } from "three/src/math/MathUtils.js";
import * as THREE from "three";
import { type OrbitControls as OrbitControlsImpl } from "three-stdlib";

export default function CameraControl() {
  const localCameraRef = useRef<THREE.PerspectiveCamera>(null!);
  const localControlRef = useRef<OrbitControlsImpl>(null!);

  const setRefs = useCameraInit((state) => state.setRefs);

  const cameraBlock = useTweaks((state) => state.cameraBlock);

  // Set Camera init position
  const { target, pos } = useCameraInit(
    useShallow((state) => ({
      target: state.target,
      pos: state.pos,
    })),
  );

  useEffect(() => {
    setRefs({
      cameraRef: localCameraRef,
      controlRef: localControlRef,
    });
  }, []);

  return (
    <>
      <OrbitControls
        ref={localControlRef}
        makeDefault
        target={[target.x, target.y, target.z]}
        maxPolarAngle={degToRad(89.5)}
        dampingFactor={0.05}
        maxDistance={10}
        enablePan={false}
        enabled={!cameraBlock}
      />
      <PerspectiveCamera
        ref={localCameraRef}
        near={0.01}
        far={50}
        fov={50}
        position={[pos.x, pos.y, pos.z]}
        makeDefault
      />
    </>
  );
}
