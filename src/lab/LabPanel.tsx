import { Leva, folder, useControls } from "leva";
import { useEffect } from "react";
import { useLab, type LabTool } from "./store";

// leva 패널 값을 실험실 스토어로 옮긴다. 장면 컴포넌트는 스토어만 읽는다.
export default function LabPanel() {
  const v = useControls({
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
