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

export type LabTool = "none" | "statsgl" | "r3fperf";

// 맥북 화면(drei Html로 띄운 DOM) 실험용 스위치. 기본값은 실제 사이트와 같다.
export interface ScreenLab {
  html: boolean; // Html(DOM) 자체를 띄울지 (맥북 모델은 그대로)
  frameStyle: boolean; // Screen의 useFrame이 매 프레임 filter·opacity를 쓰는지
  backdrop: boolean; // 화면 안 backdrop-blur 효과
  occlude: boolean; // occlude="blending" (캔버스에 구멍을 뚫어 뒤의 DOM을 보여 줌)
  res: number; // 화면 DOM의 CSS 해상도 배율 (월드 크기는 유지)
}

export interface LabState {
  tool: LabTool;
  dpr: "default" | number;
  post: boolean;
  environment: boolean;
  rectArea: boolean;
  ambient: boolean;
  models: Record<ModelKey, boolean>;
  screen: ScreenLab;
}

// 기본값은 실제 사이트와 같게 둔다. 그래야 패널을 처음 열었을 때가 곧 기준 장면이다.
export const useLab = create<LabState>(() => ({
  tool: "none",
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
  screen: {
    html: true,
    frameStyle: true,
    backdrop: true,
    occlude: true,
    res: 1,
  },
}));
