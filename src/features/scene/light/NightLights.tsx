import { useLab } from "@/features/lab/store";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { setMoonDir } from "../constants";
import { LIGHTNING } from "../lightningUniforms";

// RectAreaLight는 LTC 조회 텍스처가 있어야 PBR 재질에 빛이 닿는다. 한 번만 만든다
RectAreaLightUniformsLib.init();

// 번개 섬광 1일 때 더하는 환경맵 세기 (기본 환경맵 세기 0.12)
const FLASH_ENV = 0.9;

// 밤 조명: 달빛(차가운 방향광) + 퍼걸러 아래 따뜻한 등 + 약한 하늘빛. 값은 실험실 "밤 조명" 슬라이더에서 온다.
// 그림자는 쓰지 않는다. 잔디와 수면은 조명 없는 셰이더라 이 조명을 직접 받지 않고,
// 등 위치·색·세기만 uniform으로 넘겨 따뜻한 빛을 흉내 낸다 (Grass.tsx, Water.tsx).
export default function NightLights() {
  const moonIntensity = useLab((s) => s.night.moonIntensity);
  const lampIntensity = useLab((s) => s.night.lampIntensity);
  const lampColor = useLab((s) => s.night.lampColor);
  const lampPos = useLab((s) => s.night.lampPos);
  const hemiIntensity = useLab((s) => s.night.hemiIntensity);
  const moonOn = useLab((s) => s.night.moonOn);
  const lampOn = useLab((s) => s.night.lampOn);
  const lampType = useLab((s) => s.night.lampType);
  const rectIntensity = useLab((s) => s.night.rectIntensity);
  const rectSize = useLab((s) => s.night.rectSize);
  const hemiOn = useLab((s) => s.night.hemiOn);
  const moonAz = useLab((s) => s.night.moonAz);
  const moonEl = useLab((s) => s.night.moonEl);
  const scene = useThree((s) => s.scene);

  // 환경맵 세기는 scene에 직접 쓴다. drei Environment의 prop으로 바꾸면 자식이 다시 렌더링되며
  // 큐브맵과 PMREM을 다시 만들 수 있어서다 (Lights.tsx의 StudioEnvironment 주석 참고).
  // 번개가 치면 환경맵도 함께 올린다. 위에서 내리꽂는 번개 라이트만으로는 퍼걸러 아래 타일 바닥이나
  // 기둥 옆면처럼 위를 향하지 않는 면이 거의 밝아지지 않는데, 환경맵은 모든 방향에서 고르게 비춘다.
  useFrame(({ scene }) => {
    scene.environmentIntensity =
      useLab.getState().night.envIntensity + LIGHTNING.value * FLASH_ENV;
  });
  useEffect(
    () => () => {
      scene.environmentIntensity = 1;
    },
    [scene],
  );

  // 달빛 방향도 하늘의 달 위치를 따라간다
  const moon = setMoonDir(moonAz, moonEl).clone().multiplyScalar(20);
  return (
    <>
      <directionalLight
        visible={moonOn}
        position={[moon.x, moon.y, moon.z]}
        color="#9fb4ff"
        intensity={moonIntensity}
      />
      <pointLight
        visible={lampOn && lampType === "point"}
        position={lampPos}
        color={lampColor}
        intensity={lampIntensity}
        distance={7}
        decay={2}
      />
      {/* 기존 씬 방식: 퍼걸러 천장에서 아래를 향하는 사각 면광원 */}
      {lampOn && lampType === "rect" && (
        <rectAreaLight
          position={lampPos}
          rotation={[-Math.PI / 2, 0, 0]}
          width={rectSize}
          height={rectSize}
          color={lampColor}
          intensity={rectIntensity}
        />
      )}
      <hemisphereLight
        visible={hemiOn}
        args={["#1d2a4d", "#05070a", hemiIntensity]}
      />
    </>
  );
}
