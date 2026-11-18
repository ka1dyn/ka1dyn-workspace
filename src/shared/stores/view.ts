import { create } from "zustand";

export const OverlayTypes = {
  NONE: "none",
  DEFAULT: "default",
  SCREEN: "screen",
} as const;

export type OverlayTypes = (typeof OverlayTypes)[keyof typeof OverlayTypes];

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

export interface DiveType {
  dive: boolean;
  setDive: (newState: boolean) => void;
}

export const useOverlay = create<OverlayType>((set) => ({
  active: false,
  type: OverlayTypes.NONE,
  lowDpr: false,
  setActive: (newActive: boolean) => {
    set({ active: newActive });
  },
  setType: (newType: OverlayTypes) => {
    set({ type: newType });
  },
  setLowDpr: (newState: boolean) => {
    set({ lowDpr: newState });
  },
}));

export const useFullscreen = create<FullsceenType>((set) => ({
  fullscreen: false,
  setFullscreen: (newState: boolean) => {
    set({ fullscreen: newState });
  },
}));

export const useDive = create<DiveType>((set) => ({
  dive: false,
  setDive: (newState: boolean) => {
    set({ dive: newState });
  },
}));
