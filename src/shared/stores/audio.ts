import { create } from "zustand";

export interface SoundVolType {
  music: number;
  rain: number;
  lightning: number;
  setMusic: (newState: number) => void;
  setRain: (newState: number) => void;
  setLightning: (newState: number) => void;
}

export interface AudioType {
  audioActive: boolean;
  audioPrev: boolean;
  setAudioActive: (newState: boolean) => void;
  setAudioPrev: (newState: boolean) => void;
}

export const useSoundVol = create<SoundVolType>((set) => ({
  music: 0.5,
  rain: 0.5,
  lightning: 0.5,
  setMusic: (newVol: number) => {
    set({ music: newVol });
  },
  setRain: (newVol: number) => {
    set({ rain: newVol });
  },
  setLightning: (newVol: number) => {
    set({ lightning: newVol });
  },
}));

export const useAudio = create<AudioType>((set) => ({
  audioActive: true,
  audioPrev: false,
  setAudioActive: (newState: boolean) => set({ audioActive: newState }),
  setAudioPrev: (newState: boolean) => set({ audioPrev: newState }),
}));
