import { create } from "zustand";

export interface LightType {
  intensity: number;
  lightColor: string;
  setIntensity: (newState: number) => void;
  setLightColor: (newState: string) => void;
}

export const useLight = create<LightType>((set) => ({
  intensity: 3,
  lightColor: "#c8b087",
  setIntensity: (newState: number) => {
    set({ intensity: newState });
  },
  setLightColor: (newState: string) => set({ lightColor: newState }),
}));
