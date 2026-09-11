import { useCameraInit, useOverlay, useTweaks } from "@/stores";
import { GsapEase, OverlayTypes } from "@/types/enums";
import { useCallback } from "react";
import { useShallow } from "zustand/shallow";
import gsap from "gsap";
import type * as THREE from "three";
import { BASE_FOV } from "@/constants/camera";
import { overviewFov } from "@/utils/cameraFit";

export default function useCameraAnim() {
  const { cameraRef, controlRef } = useCameraInit(
    useShallow((state) => ({
      ...state,
    })),
  );

  const setCameraBlock = useTweaks((state) => state.setCameraBlock);

  const { setLowDpr, setType, setActive } = useOverlay(
    useShallow((state) => ({
      type: state.type,
      setLowDpr: state.setLowDpr,
      setType: state.setType,
      setActive: state.setActive,
    })),
  );

  const { target, pos } = useCameraInit(
    useShallow((state) => ({
      target: state.target,
      pos: state.pos,
    })),
  );

  /**
   * Tween the vertical FOV alongside the pose move. The two poses want opposite
   * things -- the overview needs a wide angle to keep the room in frame on a
   * narrow viewport, the screen close-up needs a tight one so the room behind
   * the monitor doesn't stretch -- so the lens travels with the camera instead
   * of snapping at the cut.
   */
  const tweenFov = (
    tl: gsap.core.Timeline,
    camera: THREE.PerspectiveCamera,
    fov: number,
    duration: number,
    ease: GsapEase,
  ) => {
    tl.to(
      camera,
      {
        fov,
        duration,
        ease,
        onUpdate: () => camera.updateProjectionMatrix(),
      },
      0,
    );
  };

  const startAnimation = useCallback(() => {
    const camera = cameraRef?.current;
    const controls = controlRef?.current;

    if (!camera || !controls) {
      console.warn("There is no camera");
      return;
    }

    setCameraBlock(true);

    const tl = gsap.timeline({
      delay: 6,
      onComplete: () => {
        setCameraBlock(false);
        setActive(true);
        setType(OverlayTypes.DEFAULT);
      },
    });

    tl.to(cameraRef.current.position, {
      x: 7.5,
      y: 2,
      z: 6,
      duration: 4,
      ease: GsapEase.POWER4_INOUT,
    });
    tl.to(
      controlRef.current.target,
      {
        x: 0,
        y: 1,
        z: 0,
        duration: 4,
        ease: GsapEase.POWER4_INOUT,

        onUpdate: () => {
          controlRef.current.update();
        },
      },
      0,
    );
    tweenFov(tl, camera, overviewFov(camera.aspect), 4, GsapEase.POWER4_INOUT);
  }, [cameraRef, controlRef]);

  const screenAnimation = useCallback(() => {
    const camera = cameraRef?.current;
    const controls = controlRef?.current;

    if (!camera || !controls) {
      console.warn("There is no camera");
      return;
    }

    setCameraBlock(true);

    const tl = gsap.timeline({
      onComplete: () => {
        setLowDpr(true);
        setActive(true);
      },
    });

    tl.to(cameraRef.current.position, {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      duration: 2,
      ease: GsapEase.POWER2_INOUT,
    });
    tl.to(
      controlRef.current.target,
      {
        x: target.x,
        y: target.y,
        z: target.z,
        duration: 2,
        ease: GsapEase.POWER2_INOUT,

        onUpdate: () => {
          controlRef.current.update();
        },
      },
      0,
    );
    tweenFov(tl, camera, BASE_FOV, 2, GsapEase.POWER2_INOUT);
  }, [target, pos, cameraRef, controlRef]);

  const backAnimation = useCallback(() => {
    const camera = cameraRef?.current;
    const controls = controlRef?.current;

    if (!camera || !controls) {
      console.warn("There is no camera");
      return;
    }
    setLowDpr(false);
    setCameraBlock(true);

    const tl = gsap.timeline({
      onComplete: () => {
        setCameraBlock(false);
        setActive(true);
      },
    });

    tl.to(cameraRef.current.position, {
      x: 7.5,
      y: 2,
      z: 6,
      duration: 2.5,
      ease: GsapEase.POWER3_INOUT,
    });
    tl.to(
      controlRef.current.target,
      {
        x: 0,
        y: 1,
        z: 0,
        duration: 2.5,
        ease: GsapEase.POWER3_INOUT,

        onUpdate: () => {
          controlRef.current.update();
        },
      },
      0,
    );
    tweenFov(tl, camera, overviewFov(camera.aspect), 2.5, GsapEase.POWER3_INOUT);
  }, [cameraRef, controlRef]);

  return { startAnimation, screenAnimation, backAnimation };
}
