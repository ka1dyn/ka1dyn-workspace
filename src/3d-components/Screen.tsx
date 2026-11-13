import Booting from "@/2d-components/Booting";
import Home from "@/2d-components/Home";
import { useCameraInit, useOverlay, useReady, useTweaks } from "@/stores";
import { OverlayTypes } from "@/types/enums";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import {
  ASPECT_EPSILON,
  SCREEN_DISTANCE_FACTOR,
  SCREEN_PX,
  SCREEN_WORLD,
} from "@/constants/camera";
import { fitDistance } from "@/utils/cameraFit";
import * as THREE from "three";
import { useShallow } from "zustand/shallow";
import { useLab } from "@/lab/store";

type screenProps = React.JSX.IntrinsicElements["group"];

export default function Screen({ ...props }: screenProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const contentRef = useRef<HTMLDivElement>(null!);
  const { setTarget, setCameraPos } = useCameraInit(
    useShallow((state) => ({
      setTarget: state.setTarget,
      setCameraPos: state.setPos,
    })),
  );
  const screenReady = useReady((state) => state.screenReady);
  const dive = useTweaks((state) => state.dive);
  const type = useOverlay((state) => state.type);
  const lab = useLab((state) => state.screen);
  // 해상도 배율을 낮추면 CSS 크기는 줄이고 distanceFactor는 키워, 월드에서 보이는 크기는 그대로 둔다.
  const screenPx = { w: SCREEN_PX.w * lab.res, h: SCREEN_PX.h * lab.res };

  const { size } = useThree();
  const lastAspect = useRef(0);

  // Place the camera on the screen's normal, far enough back that the monitor
  // fills SCREEN_FILL of the frame. Distance rather than FOV does the fitting,
  // so the room behind the monitor keeps a natural perspective on every aspect.
  useEffect(() => {
    const aspect = size.width / size.height;

    // Hysteresis: the mobile URL bar sliding in and out fires a resize on every
    // scroll. Without this the camera breathes.
    if (
      lastAspect.current &&
      Math.abs(aspect - lastAspect.current) < ASPECT_EPSILON
    ) {
      return;
    }
    lastAspect.current = aspect;

    const worldPosition = new THREE.Vector3();

    groupRef.current.updateWorldMatrix(true, false);
    groupRef.current.getWorldPosition(worldPosition);

    setTarget({
      x: worldPosition.x,
      y: worldPosition.y,
      z: worldPosition.z,
    });

    const direction = new THREE.Vector3();
    groupRef.current.getWorldDirection(direction);

    const distance = fitDistance(
      SCREEN_WORLD.w / 2,
      SCREEN_WORLD.h / 2,
      aspect,
    );
    const cameraPos = worldPosition
      .clone()
      .addScaledVector(direction, distance);

    setCameraPos({
      x: cameraPos.x,
      y: cameraPos.y,
      z: cameraPos.z,
    });
  }, [groupRef, size.width, size.height, setTarget, setCameraPos]);

  const worldPosition = new THREE.Vector3();
  const screenVec = new THREE.Vector3();
  const screenToCameraVec = new THREE.Vector3();

  // 실험실에서 매 프레임 갱신을 끄면 filter·opacity를 지워 효과가 남지 않게 한다.
  useEffect(() => {
    if (lab.frameStyle || !contentRef.current) return;
    contentRef.current.style.filter = "";
    contentRef.current.style.opacity = "";
  }, [lab.frameStyle, lab.html]);

  useFrame((state) => {
    if (!groupRef.current || !contentRef.current || !lab.frameStyle) return;

    // Screen World Postiion

    groupRef.current.updateWorldMatrix(true, false);
    groupRef.current.getWorldPosition(worldPosition);

    // Screen direction
    groupRef.current.getWorldDirection(screenVec);

    screenToCameraVec
      .copy(state.camera.position)
      .sub(worldPosition)
      .normalize();

    const distance = state.camera.position.distanceTo(worldPosition);

    const maxOpacity = 1;
    const minOpacity = 0.5;
    const maxDistance = 10;
    const minDistance = 0 as const; // Never change for calculate simple. 0!

    const distanceFactor =
      (-(maxOpacity - minOpacity) / (maxDistance - minDistance)) * distance +
      maxOpacity;

    const dot = Math.max(0, screenVec.dot(screenToCameraVec));

    const opacity = dot * distanceFactor;
    contentRef.current.style.filter = `brightness(${dot})`;
    contentRef.current.style.opacity = opacity.toString();
  });

  return (
    <group ref={groupRef} {...props}>
      {/* <axesHelper /> */}
      {lab.html && (
        <Html
          className={`overflow-hidden ${!dive && "rounded-4xl"} ${type !== OverlayTypes.SCREEN && "select-none"} ${!lab.backdrop && "lab-noblur"}`}
          style={dive ? undefined : { width: screenPx.w, height: screenPx.h }}
          pointerEvents={type === OverlayTypes.SCREEN ? "auto" : "none"}
          {...(dive
            ? {
                fullscreen: true,
              }
            : {
                transform: true,
                distanceFactor: SCREEN_DISTANCE_FACTOR / lab.res,
                occlude: lab.occlude ? "blending" : undefined,
              })}
        >
          <div
            ref={contentRef}
            className="w-full h-full @container-[size] font-pretendard"
          >
            {screenReady ? <Home /> : <Booting />}
          </div>
        </Html>
      )}
    </group>
  );
}
