import Test from "@/glb_components/Test";
import { degToRad } from "three/src/math/MathUtils.js";
import Screen from "./Screen";
import ReflectLayer from "./Night/ReflectLayer";

export default function Mac() {
  return (
    <>
      <group
        name="mac"
        rotation={[0, degToRad(110), 0]}
        position={[0.15, 0.74, -0.4]}
      >
        {/* 몸체만 반사에 넣는다. Screen(drei Html)의 occlusion 평면이 반사에 구멍을 내지 않도록 밖에 둔다. */}
        <ReflectLayer>
          <Test glb_path="/models/macbook/macbook_fix.glb" scale={0.15} />
        </ReflectLayer>
        <Screen rotation={[0, degToRad(-90), 0]} position={[0.161, 0.169, 0]} />
      </group>
    </>
  );
}
