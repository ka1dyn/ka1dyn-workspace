import { create } from "zustand";
import type { RefObject } from "react";
import * as THREE from "three";
import { type OrbitControls as OrbitControlsImpl } from "three-stdlib";

// world position
export interface Wpos {
  x: number;
  y: number;
  z: number;
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

export interface CameraBlockType {
  cameraBlock: boolean;
  setCameraBlock: (newState: boolean) => void;
}

export const useCameraInit = create<CameraInitType>((set) => ({
  target: {
    x: 0,
    y: 0,
    z: 0,
  },
  pos: {
    x: 0,
    y: 0,
    z: 0,
  },
  cameraRef: null,
  controlRef: null,
  setTarget: (newTarget: Wpos) => {
    set({ target: { ...newTarget } });
  },
  setPos: (newPos: Wpos) => {
    set({ pos: { ...newPos } });
  },
  setRefs: (refs) => set({ ...refs }),
}));

export const useCameraBlock = create<CameraBlockType>((set) => ({
  cameraBlock: false,
  setCameraBlock: (newState: boolean) =>
    set({
      cameraBlock: newState,
    }),
}));
