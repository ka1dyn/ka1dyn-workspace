import { OverlayTypes, useCameraBlock, useCameraInit, useOverlay } from "@/shared/stores";
import { GsapEase } from "@/shared/types/enums";
import gsap from "gsap";
import { BASE_FOV } from "@/shared/constants/camera";
import { overviewFov } from "@/shared/utils/cameraFit";
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

  const cameraBlock = useCameraBlock((state) => state.cameraBlock);

  // Set Camera init position
  const { target, pos } = useCameraInit(
    useShallow((state) => ({
      target: state.target,
      pos: state.pos,
    })),
  );

  // Camera position is owned imperatively too -- do NOT pass a `position` prop
  // to <PerspectiveCamera>. Screen.tsx re-derives `pos` on every resize, and a
  // prop would teleport the camera to the close-up pose even while in the
  // overview or mid-tween.
  //
  // - NONE (boot): the camera is parked at the close-up, so follow `pos`
  //   directly, unless startAnimation is already moving it.
  // - SCREEN: ease to the re-fitted distance. Skip the run where only the type
  //   flipped; entering the pose is screenAnimation's job.
  // - DEFAULT: `pos` is irrelevant to the overview pose, leave the camera alone.
  const posRef = useRef(pos);
  useEffect(() => {
    const camera = localCameraRef.current;
    const prev = posRef.current;
    posRef.current = pos;

    if (!camera) return;

    if (type === OverlayTypes.NONE) {
      if (!gsap.isTweening(camera.position)) {
        camera.position.set(pos.x, pos.y, pos.z);
      }
      return;
    }

    if (type !== OverlayTypes.SCREEN || prev === pos) return;

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
        makeDefault
      />
    </>
  );
}
