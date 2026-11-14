import { create } from "zustand";

// `?lab`이 붙었을 때만 실험실 패널과 HUD를 켠다. 없으면 실제 사이트와 똑같이 동작한다.
export const IS_LAB = new URLSearchParams(window.location.search).has("lab");

// 캔버스 MSAA. WebGL 컨텍스트 설정은 만들 때 한 번만 정해지므로 URL(?lab&msaa)로 받고,
// 패널에서 바꾸면 URL을 고쳐 페이지를 다시 연다.
export const IS_MSAA =
  IS_LAB && new URLSearchParams(window.location.search).has("msaa");

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

// 밤 씬 실험용 스위치. 이 브랜치의 기본값이 곧 새 기준 장면이다.
export interface NightLab {
  scene: "old" | "night"; // old: 기존 돌 지형·스튜디오 조명, night: 밤 잔디밭
  grass: boolean;
  grassCount: number;
  groundSize: number; // 밤 씬 돌 지형 한 변(m). 기존 씬은 15
  grassSegments: number; // 잎 하나의 세로 분할 수 (삼각형 = 2 × 분할). 2면 꺾인 막대처럼 휜다
  wind: boolean;
  windStrength: number; // 바람 세기 배율
  windSpeed: number; // 바람 속도 배율 (흔들림·돌풍이 흐르는 빠르기)
  grassHeight: number; // 잎 높이 배율 (셰이더 uniform이라 다시 심지 않는다)
  grassWidth: number; // 잎 폭 배율
  grassOnWater: boolean;
  cursorPush: boolean; // 커서가 닿는 잔디가 바깥으로 눕는다
  cursorRadius: number; // 커서 밀기 반경 (m)
  cursorStrength: number; // 커서 밀기 세기
  cursorRecover: number; // 눌린 잔디가 다시 서는 데 걸리는 시간 (초)
  grain: boolean; // 필름 그레인 (Night/Grain.tsx)
  grainAmount: number; // 그레인 세기 (밝기 변화 폭)
  grainSize: number; // 그레인 입자 크기 (CSS 픽셀. DPR 1.5에서 0.67 = 실제 픽셀 1개)
  skyQuality: "new" | "old"; // 밤하늘 셰이더 (Night/Sky.tsx). old = 이전 하늘(비교·측정용)
  starDensity: number;
  starBright: number;
  starTwinkle: number; // 별 반짝임 세기 (밝기 ±)
  milkyWay: number; // 은하수 세기
  milkyRotation: number; // 은하수 방위 회전 (도)
  treeLayers: number; // 숲 겹 수 (1~3)
  treeHeight: number; // 숲 높이 배율
  fireflies: number; // 반딧불이 수 (Night/Fireflies.tsx)
  fireflySize: number; // 빛 번짐까지 포함한 지름 (m)
  fireflyBright: number;
  fireflySpeed: number; // 떠다니는 속도 배율
  fireflyFalloff: number; // 거리 감쇠 (1 = 실제 원근, 0 = 같은 크기)
  fireflyMinPx: number; // 최소 크기 (CSS px)
  fireflyMaxHeight: number; // 가장 높이 나는 높이 (m). 대부분은 잔디 끝 근처에 머문다
  rainCount: number; // 빗방울 개수 (기존 300)
  rainSpeed: number; // 떨어지는 속도 m/s (기존 6)
  rainSpread: number; // 비가 내리는 정사각형 한 변 m (기존 10)
  rainSparkleOn: boolean; // 빗방울이 가끔 살짝 반짝인다 (기존 빗방울 셰이더 그대로)
  rainSparkle: number; // 반짝임 빈도 (0~1)
  rainSparkleBoost: number; // 반짝일 때 진해지는 배율
  grainDark: number; // 어두운 곳 그레인: 밝기와 무관하게 더하고 빼는 폭 (0이면 끔) // 물웅덩이 자리에도 심어 지형을 더 많이 덮는다
  puddles: boolean; // 수면 평면 (돌 지형의 낮은 곳에만 물이 보인다)
  waterLevel: number; // 수면 월드 높이 (m)
  reflection: boolean; // 평면 반사 패스 (끄면 하늘색만 비침)
  reflectionRes: number; // 반사 타깃 해상도 (CSS 크기 대비)
  blur: boolean; // 반사 밉맵 흐림
  grassInReflection: boolean;
  rippleRadius: number; // 빗방울 파문 탐색 반경 R. 픽셀당 (2R+1)² 반복, 0이면 끔
  // 조명 (밤 씬 전용)
  moonIntensity: number;
  lampIntensity: number;
  lampColor: string;
  lampPos: [number, number, number];
  hemiIntensity: number;
  envIntensity: number;
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
  night: NightLab;
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
  night: {
    scene: "night",
    grass: true,
    grassCount: 100000,
    groundSize: 17,
    grassSegments: 4,
    wind: true,
    windStrength: 1,
    windSpeed: 1,
    grassHeight: 2.1,
    grassWidth: 1.2,
    grassOnWater: false,
    cursorPush: true,
    cursorRadius: 1.2,
    cursorStrength: 1.5,
    cursorRecover: 0.5,
    grain: true,
    grainAmount: 0.08,
    grainSize: 0.67,
    grainDark: 0.05,
    skyQuality: "new",
    starDensity: 1,
    starBright: 1,
    starTwinkle: 0.15,
    milkyWay: 1,
    milkyRotation: -40,
    treeLayers: 3,
    treeHeight: 1,
    fireflies: 30,
    fireflySize: 0.07,
    fireflyBright: 1.5,
    fireflySpeed: 1.2,
    fireflyFalloff: 0.4,
    fireflyMinPx: 5,
    fireflyMaxHeight: 1.3,
    rainCount: 300,
    rainSpeed: 7.5,
    rainSpread: 12,
    rainSparkleOn: true,
    rainSparkle: 0.4,
    rainSparkleBoost: 0.6,
    puddles: true,
    waterLevel: -0.03,
    reflection: true,
    reflectionRes: 0.5,
    blur: true,
    grassInReflection: false,
    rippleRadius: 1,
    moonIntensity: 1.6,
    lampIntensity: 4,
    lampColor: "#ffb36b",
    lampPos: [0, 2.3, 0],
    hemiIntensity: 0.35,
    envIntensity: 0.12,
  },
}));

// 콘솔에서 실험실 값을 직접 바꿔 측정할 수 있게 실험실에서만 노출한다
// (예: __lab.setState((s) => ({ night: { ...s.night, starDensity: 0 } })))
if (IS_LAB) (window as unknown as { __lab?: unknown }).__lab = useLab;
