import { useCameraInit, useOverlay, useTweaks } from "@/stores";
import { GsapEase, OverlayTypes } from "@/types/enums";
import { useCallback, useState } from "react";
import { useShallow } from "zustand/shallow";
import gsap from "gsap";

export default function useCameraAnim() {
  const { cameraRef, controlRef } = useCameraInit(
    useShallow((state) => ({
      ...state,
    })),
  );

  const setCameraBlock = useTweaks((state) => state.setCameraBlock);

  const { setType, setActive } = useOverlay(
    useShallow((state) => ({
      type: state.type,
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

  const startAnimation = useCallback(() => {
    const camera = cameraRef?.current;
    const controls = controlRef?.current;

    if (!camera || !controls) {
      console.warn("아직 카메라가 준비되지 않았습니다.");
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
  }, [cameraRef, controlRef]);

  const screenAnimation = useCallback(() => {
    const camera = cameraRef?.current;
    const controls = controlRef?.current;

    if (!camera || !controls) {
      console.warn("아직 카메라가 준비되지 않았습니다.");
      return;
    }

    setCameraBlock(true);

    const tl = gsap.timeline({
      onComplete: () => {
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
  }, [target, pos, cameraRef, controlRef]);

  const backAnimation = useCallback(() => {
    const camera = cameraRef?.current;
    const controls = controlRef?.current;

    if (!camera || !controls) {
      console.warn("아직 카메라가 준비되지 않았습니다.");
      return;
    }

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
  }, [cameraRef, controlRef]);

  return { startAnimation, screenAnimation, backAnimation };
}
