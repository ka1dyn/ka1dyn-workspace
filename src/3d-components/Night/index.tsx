import { degToRad } from "three/src/math/MathUtils.js";
import { Drops } from "../Rain/Drops";
import { Splashes } from "../Rain/Splashes";
import { FOG_COLOR, FOG_FAR, FOG_NEAR } from "./constants";
import Sky from "./Sky";
import Grass from "./Grass";
import Water from "./Water";
import ReflectLayer from "./ReflectLayer";
import Grain from "./Grain";
import { useRainGlowMaterial } from "./RainGlow";
import { useLab } from "@/lab/store";

// 밤 잔디밭 씬. 기존 돌 지형(Models.tsx의 GroundBase)은 그대로 두고,
// 금속 빗물 바닥 대신 수면 평면을 깔아 지형의 낮은 곳을 물웅덩이로 만든다.
// 퍼걸러, 타일 바닥, 맥북, 소품도 Models.tsx에서 그대로 쓴다.
export default function NightScene() {
  const n = useLab((state) => state.night);
  return (
    <>
      <fog attach="fog" args={[FOG_COLOR, FOG_NEAR, FOG_FAR]} />
      <ReflectLayer>
        <Sky />
      </ReflectLayer>
      {n.grass && (
        <Grass
          count={n.grassCount}
          segments={n.grassSegments}
          wind={n.wind}
          inReflection={n.grassInReflection}
        />
      )}
      {n.puddles && (
        <Water
          reflection={n.reflection}
          reflectionRes={n.reflectionRes}
          blur={n.blur}
          grassInReflection={n.grassInReflection}
          rippleRadius={n.rippleRadius}
        />
      )}
      <NightRain />
      <Grain />
    </>
  );
}

// 기존 RainGround에서 빗방울과 물튀김만 떼어 온다.
// 변환 순서(바닥면 -90° → 자식 +90°)를 그대로 둬서 비가 떨어지는 범위가 같다.
// (RainGround는 `{ props }`로 구조 분해해서 Models가 넘긴 50° 회전이 실제로는 적용되지 않았다.)
function NightRain() {
  const glow = useLab((s) => s.night.rainGlowOn);
  const glowMaterial = useRainGlowMaterial();
  return (
    <group>
      <group rotation={[degToRad(-90), 0, 0]}>
        <Drops
          rotation={[degToRad(90), 0, 0]}
          material={glow ? glowMaterial : undefined}
        />
        <Splashes count={200} rotation={[degToRad(90), 0, 0]}>
          <mesh position={[0, 0, 0.01]}>
            <circleGeometry args={[5, 32]} />
            <meshBasicMaterial color="white" transparent={true} opacity={0} />
          </mesh>
        </Splashes>
      </group>
    </group>
  );
}
