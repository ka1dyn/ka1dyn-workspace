// Screen store types

export interface ModalData {
  name: string;
  isDown: boolean;
  isClosing: boolean;
  zIndex: number;
  isFull: boolean;
  contentPath: string;
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
  bringToFront: (name: string) => void;
  openModal: (name: string, x: number, y: number) => void;
  closeModalStart: (name: string) => void;
  closeModalComplete: (name: string) => void;
  downupModal: (name: string, newState: boolean) => void;
  expandModal: (name: string) => void;
  collapseModal: (name: string) => void;
  setContentPath: (name: string, newPath: string) => void;
}

// Modal view state (not subscribe, only get/set)
export interface ModalViewStore {
  rects: Record<string, ModalPos>;
  scrolls: Record<string, number>;
  setRect: (name: string, rect: Partial<ModalPos>) => void;
  setScroll: (name: string, top: number) => void;
  clear: (name: string) => void;
}

export interface BgImageStore {
  path: string;
  changeBackground: (newPath: string) => void;
}
