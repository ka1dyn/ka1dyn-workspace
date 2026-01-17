import { create } from "zustand";
import type {
  StartType,
  Wpos,
  CameraInitType,
  ReadyType,
  OverlayType,
  FullsceenType,
  TweaksType,
} from "./types/types";
import { OverlayTypes } from "./types/enums";

export const useStart = create<StartType>((set) => ({
  start: false,
  setStart: (newStart: boolean) => {
    set({ start: newStart });
  },
}));

export const useReady = create<ReadyType>((set) => ({
  frameReady: false,
  textureReady: false,
  screenReady: false,
  setFrameReady: (newState: boolean) => {
    set({ frameReady: newState });
  },
  setTextureReady: (newState: boolean) => {
    set({ textureReady: newState });
  },
  setScreenReady: (newState: boolean) => {
    set({ screenReady: newState });
  },
}));

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
  setTarget: (newTarget: Wpos) => {
    set({ target: { ...newTarget } });
  },
  setPos: (newPos: Wpos) => {
    set({ pos: { ...newPos } });
  },
}));

export const useOverlay = create<OverlayType>((set) => ({
  active: false,
  type: OverlayTypes.NONE,
  setActive: (newActive: boolean) => {
    set({ active: newActive });
  },
  setType: (newType: OverlayTypes) => {
    set({ type: newType });
  },
}));

export const useFullscreen = create<FullsceenType>((set) => ({
  fullscreen: false,
  setFullscreen: (newState: boolean) => {
    set({ fullscreen: newState });
  },
}));

export const useTweaks = create<TweaksType>((set) => ({
  intensity: 3,
  lightColor: "#c8b087",
  audioActive: true,
  dive: false,
  setIntensity: (newState: number) => {
    set({ intensity: newState });
  },
  setLightColor: (newState: string) => set({ lightColor: newState }),
  setAudioActive: (newState: boolean) => set({ audioActive: newState }),
  setDive: (newState: boolean) => {
    set({ dive: newState });
  },
}));
