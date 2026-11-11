import { create } from "zustand";

// `?lab`이 붙었을 때만 실험실 패널과 HUD를 켠다. 없으면 실제 사이트와 똑같이 동작한다.
export const IS_LAB = new URLSearchParams(window.location.search).has("lab");

export type ModelKey =
  | "rainGround"
  | "pergola"
  | "groundBase"
  | "things"
  | "mac"
  | "floor"
  | "clouds";

export interface LabState {
  dpr: "default" | number;
  post: boolean;
  environment: boolean;
  rectArea: boolean;
  ambient: boolean;
  models: Record<ModelKey, boolean>;
}

// 기본값은 실제 사이트와 같게 둔다. 그래야 패널을 처음 열었을 때가 곧 기준 장면이다.
export const useLab = create<LabState>(() => ({
  dpr: "default",
  post: false,
  environment: true,
  rectArea: true,
  ambient: true,
  models: {
    rainGround: true,
    pergola: true,
    groundBase: true,
    things: true,
    mac: true,
    floor: true,
    clouds: true,
  },
}));
