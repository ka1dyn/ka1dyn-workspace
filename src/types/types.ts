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
  lowDpr: boolean;
  setActive: (newActive: boolean) => void;
  setType: (newType: OverlayTypes) => void;
  setLowDpr: (newState: boolean) => void;
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
  audioPrev: boolean;
  dive: boolean;
  setCameraBlock: (newState: boolean) => void;
  setIntensity: (newState: number) => void;
  setLightColor: (newState: string) => void;
  setAudioActive: (newState: boolean) => void;
  setAudioPrev: (newState: boolean) => void;
  setDive: (newState: boolean) => void;
}

export interface SoundVolType {
  music: number;
  rain: number;
  lightning: number;
  setMusic: (newState: number) => void;
  setRain: (newState: number) => void;
  setLightning: (newState: number) => void;
}

export interface ModalData extends ModalPos {
  name: string;
  isDown: boolean;
  isClosing: boolean;
  zIndex: number;
  isFull: boolean;
}

export interface ModalPos {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ModalStore {
  zStack: number;
  count: number;
  modals: Record<string, ModalData>;
  backupFns: Record<string, () => Promise<void> | void>;
  bringToFront: (name: string) => void;
  openModal: (name: string, x: number, y: number) => void;
  closeModalStart: (name: string) => void;
  closeModalComplete: (name: string) => void;
  updateModal: (name: string, updates: Partial<ModalData>) => void;
  downupModal: (name: string, newState: boolean) => void;
  expandModal: (name: string, backupPos: ModalPos) => void;
  collapseModal: (name: string) => void;

  // Backup
  saveModalState: (name: string, curState: ModalData) => Promise<void>;
  registerBackup: (name: string, backupFn: () => Promise<void> | void) => void;
  backupAll: () => Promise<void>;
}

export interface BgImageStore {
  path: string;
  changeBackground: (newPath: string) => void;
}

/* General types */

// world position
export interface Wpos {
  x: number;
  y: number;
  z: number;
}
