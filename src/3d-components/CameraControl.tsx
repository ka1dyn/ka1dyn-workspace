import { useCameraInit, useTweaks } from "@/stores";
import { useShallow } from "zustand/shallow";
import { useEffect, useRef } from "react";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { degToRad } from "three/src/math/MathUtils.js";
import * as THREE from "three";
import { type OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useThree } from "@react-three/fiber";

export default function CameraControl() {
  const { size } = useThree(); // 현재 캔버스 크기를 가져옵니다.

  const localCameraRef = useRef<THREE.PerspectiveCamera>(null!);
  const localControlRef = useRef<OrbitControlsImpl>(null!);

  const baseFov = 50; // Original vFOV
  const breakAspect = 1.6; // Standard Aspect Ratio

  useEffect(() => {
    const camera = localCameraRef.current;
    if (!camera) return;

    const aspect = size.width / size.height;
    camera.aspect = aspect;

    if (aspect < breakAspect) {
      const radianVfov = THREE.MathUtils.degToRad(baseFov);
      const hFovAtBreak = 2 * Math.atan(Math.tan(radianVfov / 2) * breakAspect);

      // Calculate new vFov
      const newVfov = 2 * Math.atan(Math.tan(hFovAtBreak / 2) / aspect);
      camera.fov = THREE.MathUtils.radToDeg(newVfov);
    } else {
      camera.fov = baseFov;
    }

    camera.updateProjectionMatrix();
  }, [size, baseFov, breakAspect]);

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
