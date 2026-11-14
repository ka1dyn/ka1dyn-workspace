import { Splashes } from "./Rain/Splashes";
import Test from "../glb_components/Test";
import { GroundBase, RainGround } from "./Ground/TestGround";
import { Floor } from "./Floor";
import { degToRad } from "three/src/math/MathUtils.js";
import { RainClouds } from "./Cloud";
import Mac from "./Mac";
import { useLab } from "@/lab/store";
import NightScene from "./Night";
import ReflectLayer from "./Night/ReflectLayer";

export default function Models() {
  const m = useLab((state) => state.models);
  const night = useLab((state) => state.night.scene === "night");
  const groundSize = useLab((state) => state.night.groundSize);

  return (
    <>
      <group name="rain">
        {!night && m.rainGround && (
          <RainGround rotation={[0, degToRad(50), 0]} />
        )}
        {m.pergola && (
          <ReflectLayer>
            <Splashes>
              <Test glb_path="/models/pergola/pergola.glb" />
            </Splashes>
          </ReflectLayer>
        )}
      </group>
      {night && <NightScene />}
      {m.groundBase && (
        // 밤 씬에서는 물웅덩이에 비치도록 반사 레이어에도 올린다 (위치·회전은 Night/terrain.ts와 같아야 한다)
        <ReflectLayer>
          <GroundBase
            size={night ? groundSize : 15}
            position={[0, -0.03, 0]}
            rotation={[0, degToRad(50), 0]}
          />
        </ReflectLayer>
      )}

      {/* 반사 레이어는 밤 씬의 물웅덩이만 쓴다. 기존 씬에서는 아무 영향이 없다. */}
      <ReflectLayer>
        {m.things && <Test glb_path="/models/things/things.glb" />}
        {m.floor && <Floor />}
      </ReflectLayer>

      {m.mac && <Mac />}

      {m.clouds && <RainClouds />}
    </>
  );
}
