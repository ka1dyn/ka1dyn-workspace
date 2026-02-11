import Booting from "@/2d-components/Booting";
import Home from "@/2d-components/Home";
import { useCameraInit, useOverlay, useReady, useTweaks } from "@/stores";
import { OverlayTypes } from "@/types/enums";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
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
        className={`w-640 h-425 overflow-hidden ${!dive && "rounded-4xl"} ${type !== OverlayTypes.SCREEN && "select-none"}`}
        pointerEvents={type === OverlayTypes.SCREEN ? "auto" : "none"}
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
        <div ref={contentRef} className="w-full h-full @container-[size]">
          {screenReady ? <Home /> : <Booting />}
        </div>
      </Html>
    </group>
  );
}
