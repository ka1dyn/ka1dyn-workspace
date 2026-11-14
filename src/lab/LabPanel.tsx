import { Leva, folder, useControls } from "leva";
import { useEffect } from "react";
import { useLab, type LabTool } from "./store";

// leva 패널 값을 실험실 스토어로 옮긴다. 장면 컴포넌트는 스토어만 읽는다.
export default function LabPanel() {
  const v = useControls({
    "밤 씬": folder({
      씬: {
        value: "night",
        options: { "밤 잔디밭 (새)": "night", "기존 (돌 지형)": "old" },
      },
      "땅 크기 (m)": { value: 17, min: 15, max: 40, step: 1 },
      잔디: true,
      "잔디 개수": {
        value: 100000,
        options: { "10k": 10000, "25k": 25000, "50k": 50000, "100k": 100000 },
      },
      "잎 분할": { value: 4, options: { "2": 2, "4": 4, "6": 6, "10": 10 } },
      바람: true,
      "바람 세기": { value: 1, min: 0, max: 3, step: 0.05 },
      "바람 속도": { value: 1, min: 0.1, max: 3, step: 0.05 },
      "잔디 높이 배율": { value: 2.1, min: 0.5, max: 4, step: 0.1 },
      "잔디 폭 배율": { value: 1.2, min: 0.5, max: 3, step: 0.1 },
      "물웅덩이에도 심기": false,
      "커서로 잔디 밀기": true,
      "커서 반경 (m)": { value: 1.2, min: 0.2, max: 3, step: 0.05 },
      "커서 세기": { value: 1.5, min: 0, max: 2, step: 0.05 },
      "다시 서는 시간 (초)": { value: 0.5, min: 0.3, max: 6, step: 0.1 },
      물웅덩이: true,
      // 패널 칸이 좁아 m 단위 소수(-0.030)가 "-0.0"으로 잘려 보이므로 cm로 표시한다
      "수면 높이 (cm)": { value: -3, min: -12, max: 8, step: 0.5 },
      "평면 반사": true,
      "반사 해상도": {
        value: 0.5,
        options: { "1/2 CSS": 0.5, "1/4 CSS": 0.25, "1 CSS": 1 },
      },
      "반사 흐림 (밉맵)": true,
      "반사에 잔디 포함": false,
      "파문 반경 R": {
        value: 1,
        options: { 끔: 0, "1 (9회)": 1, "2 (25회)": 2, "3 (49회)": 3 },
      },
    }),
    "빗방울 반짝임": folder({
      "빗방울 개수": {
        value: 300,
        options: {
          없음: 0,
          "150": 150,
          "300 (기존)": 300,
          "500": 500,
          "800": 800,
          "1000": 1000,
          "1500": 1500,
        },
      },
      "떨어지는 속도 (m/s)": { value: 6, min: 1, max: 20, step: 0.5 },
      "비 범위 (m)": { value: 18, min: 6, max: 30, step: 1 },
      "반짝이는 빗방울": true,
      "반짝임 빈도": { value: 0.5, min: 0, max: 1, step: 0.05 },
      "반짝임 세기": { value: 1.5, min: 0, max: 4, step: 0.1 },
    }),
    "필름 그레인": folder({
      "그레인 켜기": true,
      "그레인 세기": { value: 0.08, min: 0, max: 0.6, step: 0.01 },
      "입자 크기 (CSS px)": { value: 0.67, min: 0.4, max: 3, step: 0.01 },
      "어두운 곳 그레인": { value: 0.05, min: 0, max: 0.1, step: 0.005 },
    }),
    "밤 조명": folder({
      달빛: { value: 1.6, min: 0, max: 3, step: 0.05 },
      "등 세기": { value: 4, min: 0, max: 20, step: 0.1 },
      "등 색": "#ffb36b",
      "등 위치": { value: [0, 2.3, 0], step: 0.05 },
      하늘빛: { value: 0.35, min: 0, max: 2, step: 0.05 },
      환경맵: { value: 0.12, min: 0, max: 1, step: 0.01 },
    }),
    "측정 도구": {
      value: "none",
      options: {
        "실험실 HUD만": "none",
        "stats-gl": "statsgl",
        "r3f-perf": "r3fperf",
      },
    },
    DPR: {
      value: "default",
      options: {
        "기본 (1~1.5)": "default",
        "0.5": 0.5,
        "1": 1,
        "1.5": 1.5,
        "2": 2,
      },
    },
    모델: folder({
      "빗물 바닥 (빗방울·물튀김 포함)": true,
      "퍼걸러 (+물튀김)": true,
      "돌 지형 (128×128 변위)": true,
      "소품 (things)": true,
      "맥북 + 화면": true,
      "타일 바닥": true,
      "구름 (반투명)": true,
    }),
    조명: folder({
      "Environment (Lightformer)": true,
      rectAreaLight: true,
      "ambient + hemisphere": true,
    }),
    "후처리 (Bloom + 대비)": false,
    "맥북 화면 (DOM)": folder({
      "화면 Html 표시": true,
      "매 프레임 밝기·투명도 갱신": true,
      "backdrop-blur": true,
      "occlude (blending)": true,
      "화면 DOM 해상도": {
        value: 1,
        options: {
          "2560×1700 (기본)": 1,
          "1280×850": 0.5,
          "640×425": 0.25,
        },
      },
    }),
  });

  const key = JSON.stringify(v);
  useEffect(() => {
    useLab.setState({
      tool: v["측정 도구"] as LabTool,
      dpr: v.DPR as "default" | number,
      post: v["후처리 (Bloom + 대비)"],
      environment: v["Environment (Lightformer)"],
      rectArea: v.rectAreaLight,
      ambient: v["ambient + hemisphere"],
      models: {
        rainGround: v["빗물 바닥 (빗방울·물튀김 포함)"],
        pergola: v["퍼걸러 (+물튀김)"],
        groundBase: v["돌 지형 (128×128 변위)"],
        things: v["소품 (things)"],
        mac: v["맥북 + 화면"],
        floor: v["타일 바닥"],
        clouds: v["구름 (반투명)"],
      },
      screen: {
        html: v["화면 Html 표시"],
        frameStyle: v["매 프레임 밝기·투명도 갱신"],
        backdrop: v["backdrop-blur"],
        occlude: v["occlude (blending)"],
        res: v["화면 DOM 해상도"] as number,
      },
      night: {
        scene: v["씬"] as "old" | "night",
        grass: v["잔디"],
        groundSize: v["땅 크기 (m)"],
        grassCount: v["잔디 개수"] as number,
        grassSegments: v["잎 분할"] as number,
        wind: v["바람"],
        windStrength: v["바람 세기"],
        windSpeed: v["바람 속도"],
        grassHeight: v["잔디 높이 배율"],
        grassWidth: v["잔디 폭 배율"],
        grassOnWater: v["물웅덩이에도 심기"],
        cursorPush: v["커서로 잔디 밀기"],
        cursorRadius: v["커서 반경 (m)"],
        cursorStrength: v["커서 세기"],
        cursorRecover: v["다시 서는 시간 (초)"],
        grain: v["그레인 켜기"],
        grainAmount: v["그레인 세기"],
        grainSize: v["입자 크기 (CSS px)"],
        grainDark: v["어두운 곳 그레인"],
        rainCount: v["빗방울 개수"] as number,
        rainSpeed: v["떨어지는 속도 (m/s)"],
        rainSpread: v["비 범위 (m)"],
        rainSparkleOn: v["반짝이는 빗방울"],
        rainSparkle: v["반짝임 빈도"],
        rainSparkleBoost: v["반짝임 세기"],
        puddles: v["물웅덩이"],
        waterLevel: v["수면 높이 (cm)"] / 100,
        reflection: v["평면 반사"],
        reflectionRes: v["반사 해상도"] as number,
        blur: v["반사 흐림 (밉맵)"],
        grassInReflection: v["반사에 잔디 포함"],
        rippleRadius: v["파문 반경 R"] as number,
        moonIntensity: v["달빛"],
        lampIntensity: v["등 세기"],
        lampColor: v["등 색"],
        lampPos: v["등 위치"] as [number, number, number],
        hemiIntensity: v["하늘빛"],
        envIntensity: v["환경맵"],
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 사이트 오버레이가 큰 z-index를 쓰므로 패널을 그 위로 올린다.
  return (
    <div style={{ position: "fixed", top: 0, right: 0, zIndex: 10000004 }}>
      <Leva
        titleBar={{ title: "R3F 실험실" }}
        theme={{ sizes: { rootWidth: "360px", controlWidth: "120px" } }}
      />
    </div>
  );
}
