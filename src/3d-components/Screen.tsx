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

  useFrame((state) => {
    if (!groupRef.current || !contentRef.current) return;

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
      <Html
        className={`overflow-hidden ${!dive && "rounded-4xl"} ${type !== OverlayTypes.SCREEN && "select-none"}`}
        style={dive ? undefined : { width: SCREEN_PX.w, height: SCREEN_PX.h }}
        pointerEvents={type === OverlayTypes.SCREEN ? "auto" : "none"}
        {...(dive
          ? {
              fullscreen: true,
            }
          : {
              transform: true,
              distanceFactor: SCREEN_DISTANCE_FACTOR,
              occlude: "blending",
            })}
      >
        <div
          ref={contentRef}
          className="w-full h-full @container-[size] font-pretendard"
        >
          {screenReady ? <Home /> : <Booting />}
        </div>
      </Html>
    </group>
  );
}
