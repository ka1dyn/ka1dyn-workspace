import { degToRad } from "three/src/math/MathUtils.js";
import { Drops } from "./rain/Drops";
import { Splashes } from "./rain/Splashes";
import Sky from "./sky/Sky";
import Grass from "./grass/Grass";
import Water from "./water/Water";
import ReflectLayer from "./components/ReflectLayer";
import Grain from "./effects/Grain";
import Fireflies from "./grass/Fireflies";
import { useLab } from "@/features/lab/store";

const FOG_COLOR = "#0a1020";
const FOG_NEAR = 6;
const FOG_FAR = 24;

// 밤 잔디밭: 하늘, 잔디, 반딧불이, 비, 그레인과 수면.
// 수면 평면이 돌 지형(Models.tsx의 GroundBase)의 낮은 곳을 물웅덩이로 만든다.
// 퍼걸러, 타일 바닥, 맥북, 소품은 Models.tsx에 있다.
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
      <Fireflies />
      <Grain />
    </>
  );
}

// 빗방울과 물튀김. 변환 순서(바닥면 -90° → 자식 +90°)로 비가 떨어지는 범위를 정한다.
function NightRain() {
  const on = useLab((s) => s.night.rainSparkleOn);
  const sparkle = useLab((s) => s.night.rainSparkle);
  const boost = useLab((s) => s.night.rainSparkleBoost);
  const count = useLab((s) => s.night.rainCount);
  const speed = useLab((s) => s.night.rainSpeed);
  const spread = useLab((s) => s.night.rainSpread);
  return (
    <group>
      <group rotation={[degToRad(-90), 0, 0]}>
        {count > 0 && (
          <Drops
            // 개수가 바뀌면 인스턴스 버퍼와 위치 배열을 새로 만든다
            key={count}
            count={count}
            speed={speed}
            spread={spread}
            rotation={[degToRad(90), 0, 0]}
            sparkle={on ? sparkle : 0}
            sparkleBoost={boost}
          />
        )}
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
