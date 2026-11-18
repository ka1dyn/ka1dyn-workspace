import { create } from "zustand";

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
