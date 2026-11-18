import { OverlayTypes, useCameraBlock, useCameraInit, useOverlay } from "../stores";
import { GsapEase } from "../types/enums";
import { useCallback } from "react";
import { useShallow } from "zustand/shallow";
import gsap from "gsap";
import type * as THREE from "three";
import { BASE_FOV } from "../constants/camera";
import { overviewFov } from "../utils/cameraFit";
import { useLab } from "@/features/lab/store";

// 전체 장면(overview) 카메라 위치. 밤 씬은 실험실 "카메라" 값(퍼걸러 중심 방위·높이·거리)으로 정한다.
// 기본값: 기존 위치에서 퍼걸러를 중심으로 24° 돌리고, 1.7m 높이, 조작 범위 상한(10m)에 가까운 9.9m.
// 달이 화면 왼쪽 위에, 은하수가 오른쪽 끝에 절반쯤 걸린다.
export const overviewPosition = () => {
  const n = useLab.getState().night;
  if (n.scene !== "night") return { x: 7.5, y: 2, z: 6 };
  const target = { x: 0, y: 1, z: 0 }; // 아래 애니메이션의 컨트롤 타깃과 같다
  const dy = n.camHeight - target.y;
  const r = Math.sqrt(Math.max(n.camDistance ** 2 - dy * dy, 0.01));
  const a = (n.camAngle * Math.PI) / 180;
  return { x: r * Math.cos(a), y: n.camHeight, z: r * Math.sin(a) };
};

export default function useCameraAnim() {
  const { cameraRef, controlRef } = useCameraInit(
    useShallow((state) => ({
      ...state,
    })),
  );

  const setCameraBlock = useCameraBlock((state) => state.setCameraBlock);

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
      ...overviewPosition(),
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
      ...overviewPosition(),
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
    tweenFov(
      tl,
      camera,
      overviewFov(camera.aspect),
      2.5,
      GsapEase.POWER3_INOUT,
    );
  }, [cameraRef, controlRef]);

  return { startAnimation, screenAnimation, backAnimation };
}
