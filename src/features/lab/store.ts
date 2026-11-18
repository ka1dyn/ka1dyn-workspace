import { create } from "zustand";

// `?lab`이 붙었을 때만 실험실 패널과 HUD를 켠다. 없으면 실제 사이트와 똑같이 동작한다.
export const IS_LAB = new URLSearchParams(window.location.search).has("lab");

// 캔버스 MSAA. WebGL 컨텍스트 설정은 만들 때 한 번만 정해지므로 URL(?lab&msaa)로 받고,
// 패널에서 바꾸면 URL을 고쳐 페이지를 다시 연다.
export const IS_MSAA =
  IS_LAB && new URLSearchParams(window.location.search).has("msaa");

export type ModelKey =
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
  frameStyle: boolean; // 보호필름 효과 (비스듬히 보거나 멀어지면 화면이 어두워짐)
  filmDom: boolean; // 보호필름을 이전 방식(DOM에 매 프레임 filter·opacity)으로 (비교·측정용)
  lod: boolean; // 화면이 작게 보이면 DOM을 숨기고 대체 그림을 그린다
  backdrop: boolean; // 3D 화면 안에서도 실제 backdrop-blur를 쓴다 (이전 방식, 비교·측정용)
  occlude: boolean; // occlude="blending" (캔버스에 구멍을 뚫어 뒤의 DOM을 보여 줌)
  res: number; // 화면 DOM의 CSS 해상도 배율 (월드 크기는 유지)
}

// 밤 씬 실험용 스위치. 이 브랜치의 기본값이 곧 새 기준 장면이다.
export interface NightLab {
  grass: boolean;
  grassCount: number;
  groundSize: number; // 돌 지형 한 변(m)
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
  camAngle: number; // 전체 장면 카메라: 퍼걸러 중심 방위 (°, atan2(z, x))
  camHeight: number; // 높이 (m)
  camDistance: number; // 타깃(0, 1, 0)까지 거리 (m, 조작 상한 10)
  moonAz: number; // 달 방위 (°)
  moonEl: number; // 달 고도 (°)
  starDensity: number;
  starBright: number;
  starTwinkle: number; // 별 반짝임 세기 (밝기 ±)
  milkyWay: number; // 은하수 세기
  milkyRotation: number; // 은하수 방위 회전 (도)
  milkyLanes: number; // 은하수 암흑대(어두운 먼지 줄무늬) 세기. 바꾸면 은하수를 다시 굽는다
  meteors: boolean; // 가끔 떨어지는 별똥별
  meteorInterval: number; // 별똥별 평균 간격 (초)
  meteorBright: number; // 별똥별 밝기
  meteorLength: number; // 별똥별 길이 배율
  meteorMin: number; // 차례마다 함께 떨어지는 최소 개수
  meteorMax: number; // 차례마다 함께 떨어지는 최대 개수 (1~4, 셰이더 칸 수가 4)
  meteorNow: number; // 실험실 "바로 보기" 버튼이 올리는 카운터
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
  lightning: boolean; // 번개 섬광 + 천둥 (Lightning.tsx). 구름과 따로 켠다
  lightningStrength: number; // 섬광 세기 배율 (씬 라이트·잔디·수면·하늘 모두)
  lightningNow: number; // 실험실 "번개 바로 보기" 버튼이 올리는 카운터
  grainDark: number; // 어두운 곳 그레인: 밝기와 무관하게 더하고 빼는 폭 (0이면 끔) // 물웅덩이 자리에도 심어 지형을 더 많이 덮는다
  puddles: boolean; // 수면 평면 (돌 지형의 낮은 곳에만 물이 보인다)
  waterLevel: number; // 수면 월드 높이 (m)
  reflection: boolean; // 평면 반사 패스 (끄면 하늘색만 비침)
  reflectionRes: number; // 반사 타깃 해상도 (CSS 크기 대비)
  blur: boolean; // 반사 밉맵 흐림
  grassInReflection: boolean;
  rippleRadius: number; // 빗방울 파문 탐색 반경 R. 픽셀당 (2R+1)² 반복, 0이면 끔
  reflectionEvery: number; // 반사를 몇 프레임에 한 번 다시 그릴지 (카메라가 멈춰 있으면 그 2배)
  terrainOpaque: boolean; // 돌 지형을 불투명으로 그리고 가장자리는 어두운 색으로 섞는다
  skyLast: boolean; // 하늘을 불투명 물체 중 마지막에 그려 가려진 픽셀을 건너뛴다
  grainSingle: boolean; // 그레인을 블렌딩 한 번으로 그리는 근사 방식 (Night/Grain.tsx)
  // 조명
  moonOn: boolean; // 달(방향광)
  lampOn: boolean; // 퍼걸러 아래 등. 끄면 잔디·수면에 흉내 낸 등 빛도 같이 끈다
  lampType: "point" | "rect"; // point: 점광원, rect: RectAreaLight (기존 씬 방식, 아래를 향한 사각 면광원)
  rectIntensity: number; // RectAreaLight 세기 (점광원과 단위가 달라 따로 둔다. 기존 씬 3)
  rectSize: number; // RectAreaLight 한 변 (m, 기존 씬 2.8)
  hemiOn: boolean; // 하늘빛(hemisphere)
  lightningLight: boolean; // 번개 점광원. 끄면 PBR 재질만 번쩍이지 않고, 잔디·수면·하늘의 섬광과 천둥은 그대로다
  moonIntensity: number;
  lampIntensity: number;
  lampColor: string;
  lampPos: [number, number, number];
  hemiIntensity: number;
  envIntensity: number;
}

export interface LabState {
  pause: boolean; // 캔버스가 완전히 가려진 동안(시작 화면, dive) 렌더 루프를 멈춘다
  tool: LabTool;
  dpr: "default" | number;
  post: boolean;
  environment: boolean;
  models: Record<ModelKey, boolean>;
  screen: ScreenLab;
  night: NightLab;
}

// 기본값은 실제 사이트와 같게 둔다. 그래야 패널을 처음 열었을 때가 곧 기준 장면이다.
export const useLab = create<LabState>(() => ({
  pause: true,
  tool: "none",
  dpr: "default",
  post: false,
  environment: true,
  models: {
    pergola: true,
    groundBase: true,
    things: true,
    mac: true,
    floor: true,
    clouds: false, // 밤 씬 기본: 구름 없음 (달·은하수를 가리지 않게)
  },
  screen: {
    html: true,
    frameStyle: true,
    filmDom: false,
    lod: true,
    backdrop: false,
    occlude: true,
    res: 1,
  },
  night: {
    grass: true,
    grassCount: 100000,
    groundSize: 17,
    grassSegments: 6,
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
    camAngle: 65.7,
    camHeight: 1.55,
    camDistance: 9.9,
    moonAz: -143,
    moonEl: 18.5,
    starDensity: 1,
    starBright: 0.3,
    starTwinkle: 0.6,
    milkyWay: 1,
    milkyRotation: 0,
    milkyLanes: 0.8,
    meteors: true,
    meteorInterval: 6,
    meteorBright: 0.35,
    meteorLength: 0.5,
    meteorMin: 2,
    meteorMax: 4,
    meteorNow: 0,
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
    lightning: true,
    lightningStrength: 1,
    lightningNow: 0,
    puddles: true,
    waterLevel: -0.03,
    reflection: true,
    reflectionRes: 0.5,
    blur: true,
    grassInReflection: false,
    rippleRadius: 1,
    reflectionEvery: 2,
    terrainOpaque: true,
    skyLast: true,
    grainSingle: false,
    moonOn: true,
    lampOn: true,
    lampType: "point",
    rectIntensity: 3,
    rectSize: 2.8,
    hemiOn: true,
    lightningLight: true,
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
