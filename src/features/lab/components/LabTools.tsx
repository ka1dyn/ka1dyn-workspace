import { StatsGl } from "@react-three/drei";
import { Perf } from "r3f-perf";
import { useLab } from "../store";
import "../lab.css";

// 외부 측정 도구를 하나만 골라 켠다. 실험실 HUD(좌상단)와 겹치지 않게 좌하단에 둔다.
// 둘 다 GPU 타이머 쿼리를 쓰므로, 켜는 동안 실험실 HUD의 GPU 측정은 꺼진다.
export default function LabTools() {
  const tool = useLab((state) => state.tool);

  if (tool === "statsgl") return <StatsGl trackGPU className="lab-statsgl" />;
  if (tool === "r3fperf")
    return <Perf position="bottom-left" style={{ zIndex: 10000003 }} />;
  return null;
}
