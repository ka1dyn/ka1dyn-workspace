// Store types

import type { RefObject } from "react";
import type { OverlayTypes } from "./enums";
import * as THREE from "three";
import { type OrbitControls as OrbitControlsImpl } from "three-stdlib";

export interface StartType {
  start: boolean;
  setStart: (newStart: boolean) => void;
}

export interface ReadyType {
  frameReady: boolean;
  textureReady: boolean;
  screenReady: boolean;
  setFrameReady: (newState: boolean) => void;
  setTextureReady: (newState: boolean) => void;
  setScreenReady: (newState: boolean) => void;
}

export interface CameraInitType {
  target: Wpos;
  pos: Wpos;
  cameraRef: RefObject<THREE.PerspectiveCamera> | null;
  controlRef: RefObject<OrbitControlsImpl> | null;
  setTarget: (newTarget: Wpos) => void;
  setPos: (newPos: Wpos) => void;
  setRefs: (newRefs: {
    cameraRef: RefObject<THREE.PerspectiveCamera>;
    controlRef: RefObject<OrbitControlsImpl>;
  }) => void;
}

export interface OverlayType {
  active: boolean;
  type: OverlayTypes;
  setActive: (newActive: boolean) => void;
  setType: (newType: OverlayTypes) => void;
}

export interface FullsceenType {
  fullscreen: boolean;
  setFullscreen: (newState: boolean) => void;
}

export interface TweaksType {
  cameraBlock: boolean;
  intensity: number;
  lightColor: string;
  audioActive: boolean;
  dive: boolean;
  setCameraBlock: (newState: boolean) => void;
  setIntensity: (newState: number) => void;
  setLightColor: (newState: string) => void;
  setAudioActive: (newState: boolean) => void;
  setDive: (newState: boolean) => void;
}

/* General types */

// world position
export interface Wpos {
  x: number;
  y: number;
  z: number;
}
