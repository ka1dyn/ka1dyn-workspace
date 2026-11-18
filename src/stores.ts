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
  type ModalViewStore,
  type BgImageStore,
} from "@/types/types";
import { OverlayTypes } from "@/types/enums";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { PUBLIC_IMAGES } from "@/constants/images";

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

export const useModalViewStore = create<ModalViewStore>()(
  immer(
    devtools((set) => ({
      rects: {},
      scrolls: {},

      setRect: (name, rect) =>
        set(
          (state) => {
            state.rects[name] = { ...state.rects[name], ...rect };
          },
          undefined,
          "view/rect",
        ),

      setScroll: (name, top) =>
        set(
          (state) => {
            state.scrolls[name] = top;
          },
          undefined,
          "view/scroll",
        ),

      clear: (name) =>
        set(
          (state) => {
            delete state.rects[name];
            delete state.scrolls[name];
          },
          undefined,
          "view/clear",
        ),
    })),
  ),
);

export const useModalStore = create<ModalStore>()(
  immer(
    devtools((set) => ({
      zStack: 10,
      count: 0,
      modals: {},

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
        useModalViewStore
          .getState()
          .setRect(name, { x, y, width: 1400, height: 1100 });

        set(
          (state) => {
            state.modals[name] = {
              name,
              isDown: false,
              isClosing: false,
              zIndex: 10,
              isFull: false,
              contentPath:
                name == "about_me" ? "/content/about_me.md" : "/home",
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

      closeModalComplete: (name) => {
        set(
          (state) => {
            state.count -= 1;
            delete state.modals[name];
          },
          undefined,
          "modal/close-complete",
        );

        useModalViewStore.getState().clear(name);
      },

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

      expandModal: (name) =>
        set(
          (state) => {
            if (!state.modals[name]) return;
            state.modals[name].isFull = true;
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
        // New content -> scroll top
        useModalViewStore.getState().setScroll(name, 0);

        set(
          (state) => {
            if (!state.modals[name]) return;
            state.modals[name].contentPath = newPath;
          },
          undefined,
          "modal/changePath",
        );
      },
    })),
  ),
);

export const useBgImageStore = create<BgImageStore>()(
  immer(
    devtools((set, get) => ({
      path: PUBLIC_IMAGES.DOG,
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
