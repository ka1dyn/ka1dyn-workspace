import { create } from "zustand";
import {
  type StartType,
  type Wpos,
  type CameraInitType,
  type ReadyType,
  type OverlayType,
  type FullsceenType,
  type TweaksType,
  type SoundVolType,
  type ModalStore,
  type BgImageStore,
} from "./types/types";
import { OverlayTypes } from "./types/enums";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

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

export const useTweaks = create<TweaksType>((set) => ({
  cameraBlock: false,
  intensity: 3,
  lightColor: "#c8b087",
  audioActive: true,
  audioPrev: false,
  dive: false,
  setCameraBlock: (newState: boolean) =>
    set({
      cameraBlock: newState,
    }),
  setIntensity: (newState: number) => {
    set({ intensity: newState });
  },
  setLightColor: (newState: string) => set({ lightColor: newState }),
  setAudioActive: (newState: boolean) => set({ audioActive: newState }),
  setAudioPrev: (newState: boolean) => set({ audioPrev: newState }),
  setDive: (newState: boolean) => {
    set({ dive: newState });
  },
}));

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

export const useModalStore = create<ModalStore>()(
  immer(
    devtools((set, get) => ({
      zStack: 10,
      count: 0,
      modals: {},
      backupFns: {},

      bringToFront: (name) => {
        set(
          (state) => {
            if (!state.modals[name]) return;

            state.zStack += 1;
            state.modals[name].zIndex = state.zStack;
          },
          undefined,
          "modal/zfront",
        );
      },

      openModal: (name, x, y) => {
        set(
          (state) => {
            state.modals[name] = {
              name,
              x,
              y,
              width: 1800,
              height: 1400,
              isDown: false,
              isClosing: false,
              zIndex: 10,
              isFull: false,
              contentPath: "/home",
            };
            state.count += 1;
          },
          undefined,
          "modal/open",
        );
      },

      closeModalStart: (name) =>
        set(
          (state) => {
            if (!state.modals[name]) return;
            state.modals[name].isClosing = true;
          },
          undefined,
          "modal/close-start",
        ),

      closeModalComplete: (name) =>
        set(
          (state) => {
            state.count -= 1;
            delete state.modals[name];
            delete state.backupFns[name];
          },
          undefined,
          "modal/close-complete",
        ),

      downupModal: (name, newState) =>
        set(
          (state) => {
            if (!state.modals[name]) return;
            state.zStack += 1;
            state.modals[name].zIndex = state.zStack;
            state.modals[name].isDown = newState;
          },
          undefined,
          "modal/down",
        ),

      expandModal: (name, backupPos) =>
        set(
          (state) => {
            if (!state.modals[name]) return;
            const { x, y, width, height } = backupPos;

            state.modals[name].isFull = true;
            state.modals[name].x = x;
            state.modals[name].y = y;
            state.modals[name].width = width;
            state.modals[name].height = height;
          },
          undefined,
          "modal/expand",
        ),

      collapseModal: (name) => {
        set(
          (state) => {
            if (!state.modals[name]) return;
            state.modals[name].isFull = false;
          },
          undefined,
          "modal/collapse",
        );
      },

      setContentPath: (name, newPath) => {
        set(
          (state) => {
            if (!state.modals[name]) return;
            state.modals[name].contentPath = newPath;
          },
          undefined,
          "modal/changePath",
        );
      },

      // Backup state from external input
      registerBackup: (name, backupFn) =>
        set(
          (state) => {
            state.backupFns[name] = backupFn;
          },
          undefined,
          "modal/register-backup",
        ),

      saveModalState: async (name, curState) =>
        set(
          (state) => {
            state.modals[name] = {
              ...state.modals[name],
              ...curState,
            };
          },
          undefined,
          "modal/save",
        ),

      backupAll: async () => {
        const { backupFns } = get();
        const backupPromises = Object.values(backupFns).map((fn) => fn());
        await Promise.all(backupPromises);
      },
    })),
  ),
);

export const useBgImageStore = create<BgImageStore>()(
  immer(
    devtools((set, get) => ({
      path: "/images/happy_dog.webp",
      changeBackground: (newPath: string) =>
        set(
          (state) => {
            state.path = newPath;
          },
          undefined,
          "bgimage/change",
        ),
    })),
  ),
);
