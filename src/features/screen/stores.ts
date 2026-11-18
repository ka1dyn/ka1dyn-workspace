import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { PUBLIC_IMAGES } from "@/shared/constants/images";
import type { BgImageStore, ModalStore, ModalViewStore } from "./types";

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
