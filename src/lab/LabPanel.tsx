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
      잔디: true,
      "잔디 개수": {
        value: 25000,
        options: { "10k": 10000, "25k": 25000, "50k": 50000, "100k": 100000 },
      },
      "잎 분할": { value: 6, options: { "2": 2, "6": 6, "10": 10 } },
      바람: true,
      물웅덩이: true,
      "평면 반사": true,
      "반사 해상도": {
        value: 0.5,
        options: { "1/2 CSS": 0.5, "1/4 CSS": 0.25, "1 CSS": 1 },
      },
      "반사 흐림 (밉맵)": true,
      "반사에 잔디 포함": false,
      "파문 반경 R": {
        value: 2,
        options: { 끔: 0, "1 (9회)": 1, "2 (25회)": 2, "3 (49회)": 3 },
      },
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
        grassCount: v["잔디 개수"] as number,
        grassSegments: v["잎 분할"] as number,
        wind: v["바람"],
        puddles: v["물웅덩이"],
        reflection: v["평면 반사"],
        reflectionRes: v["반사 해상도"] as number,
        blur: v["반사 흐림 (밉맵)"],
        grassInReflection: v["반사에 잔디 포함"],
        rippleRadius: v["파문 반경 R"] as number,
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
