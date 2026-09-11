import { useCameraInit, useOverlay, useTweaks } from "@/stores";
import { GsapEase, OverlayTypes } from "@/types/enums";
import gsap from "gsap";
import { BASE_FOV } from "@/constants/camera";
import { overviewFov } from "@/utils/cameraFit";
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

  const type = useOverlay((state) => state.type);
  const typeRef = useRef(type);
  useEffect(() => {
    typeRef.current = type;
  }, [type]);

  // FOV is owned imperatively, here and in the gsap timelines in useCameraAnim.
  // Do NOT pass a `fov` prop to <PerspectiveCamera> below: drei reapplies props
  // on re-render and would clobber whatever the tween left behind.
  //
  // The screen close-up fits the monitor by distance (see Screen.tsx), so it
  // always uses BASE_FOV. Only the overview pose widens as the viewport
  // narrows, and only up to MAX_FOV -- past that the room crops instead of
  // going fisheye.
  //
  // This only reconciles resizes; `type` is read through a ref so switching
  // poses doesn't snap the FOV out from under the gsap tween that owns it.
  useEffect(() => {
    const camera = localCameraRef.current;
    if (!camera) return;

    // Only the overview pose widens. NONE is the boot state, where the camera
    // is still parked at the screen close-up.
    camera.fov =
      typeRef.current === OverlayTypes.DEFAULT
        ? overviewFov(size.width / size.height)
        : BASE_FOV;
    camera.updateProjectionMatrix();
  }, [size]);

  const setRefs = useCameraInit((state) => state.setRefs);

  const cameraBlock = useTweaks((state) => state.cameraBlock);

  // Set Camera init position
  const { target, pos } = useCameraInit(
    useShallow((state) => ({
      target: state.target,
      pos: state.pos,
    })),
  );

  // Screen.tsx re-derives `pos` whenever the aspect changes, so a rotation while
  // already zoomed in has to be followed. Entering the pose is screenAnimation's
  // job, so skip the run where `pos` is unchanged and only the type flipped.
  const posRef = useRef(pos);
  useEffect(() => {
    const camera = localCameraRef.current;
    const prev = posRef.current;
    posRef.current = pos;

    if (!camera || type !== OverlayTypes.SCREEN || prev === pos) return;

    gsap.to(camera.position, {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      duration: 0.4,
      ease: GsapEase.POWER2_OUT,
      overwrite: "auto",
    });
  }, [pos, type]);

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
        position={[pos.x, pos.y, pos.z]}
        makeDefault
      />
    </>
  );
}
