import { degToRad } from "three/src/math/MathUtils.js";
import { Drops } from "../Rain/Drops";
import { Splashes } from "../Rain/Splashes";

// 밤 잔디밭 씬. 기존 씬의 돌 지형·금속 빗물 바닥을 대신한다.
// 퍼걸러, 타일 바닥, 맥북, 소품은 Models.tsx에서 그대로 쓴다.
export default function NightScene() {
  return (
    <>
      <NightRain />
    </>
  );
}

// 기존 RainGround에서 빗방울과 물튀김만 떼어 온다.
// 변환 순서(바닥면 -90° → 자식 +90°)를 그대로 둬서 비가 떨어지는 범위가 같다.
// (RainGround는 `{ props }`로 구조 분해해서 Models가 넘긴 50° 회전이 실제로는 적용되지 않았다.)
function NightRain() {
  return (
    <group>
      <group rotation={[degToRad(-90), 0, 0]}>
        <Drops rotation={[degToRad(90), 0, 0]} />
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
