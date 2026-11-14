import { useLab } from "@/lab/store";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { MOON_DIR } from "./constants";

// 밤 조명: 달빛(차가운 방향광) + 퍼걸러 아래 따뜻한 등 + 약한 하늘빛. 값은 실험실 "밤 조명" 슬라이더에서 온다.
// 그림자는 쓰지 않는다. 잔디와 수면은 조명 없는 셰이더라 이 조명을 직접 받지 않고,
// 등 위치·색·세기만 uniform으로 넘겨 따뜻한 빛을 흉내 낸다 (Grass.tsx, Water.tsx).
export default function NightLights() {
  const moonIntensity = useLab((s) => s.night.moonIntensity);
  const lampIntensity = useLab((s) => s.night.lampIntensity);
  const lampColor = useLab((s) => s.night.lampColor);
  const lampPos = useLab((s) => s.night.lampPos);
  const hemiIntensity = useLab((s) => s.night.hemiIntensity);
  const scene = useThree((s) => s.scene);

  // 환경맵 세기는 scene에 직접 쓴다. drei Environment의 prop으로 바꾸면 자식이 다시 렌더링되며
  // 큐브맵과 PMREM을 다시 만들 수 있어서다 (Lights.tsx의 StudioEnvironment 주석 참고).
  useFrame(({ scene }) => {
    scene.environmentIntensity = useLab.getState().night.envIntensity;
  });
  useEffect(
    () => () => {
      scene.environmentIntensity = 1;
    },
    [scene],
  );

  const moon = MOON_DIR.clone().multiplyScalar(20);
  return (
    <>
      <directionalLight
        position={[moon.x, moon.y, moon.z]}
        color="#9fb4ff"
        intensity={moonIntensity}
      />
      <pointLight
        position={lampPos}
        color={lampColor}
        intensity={lampIntensity}
        distance={7}
        decay={2}
      />
      <hemisphereLight args={["#1d2a4d", "#05070a", hemiIntensity]} />
    </>
  );
}
