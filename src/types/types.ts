// Store types

import type { OverlayTypes } from "./enums";

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
  setTarget: (newTarget: Wpos) => void;
  setPos: (newPos: Wpos) => void;
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
  intensity: number;
  lightColor: string;
  setIntensity: (newState: number) => void;
  setLightColor: (newState: string) => void;
}

/* General types */

// world position
export interface Wpos {
  x: number;
  y: number;
  z: number;
}
