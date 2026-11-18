import { Splashes } from "./rain/Splashes";
import Test from "./components/Test";
import { GroundBase, RainGround } from "./ground/TestGround";
import { Floor } from "./ground/Floor";
import { degToRad } from "three/src/math/MathUtils.js";
import { RainClouds } from "./sky/Cloud";
import Mac from "./mac/Mac";
import { useLab } from "@/features/lab/store";
import NightScene from "./NightScene";
import ReflectLayer from "./components/ReflectLayer";
import Lightning from "./effects/Lightning";

export default function Models() {
  const m = useLab((state) => state.models);
  const night = useLab((state) => state.night.scene === "night");
  const groundSize = useLab((state) => state.night.groundSize);
  const terrainOpaque = useLab((state) => state.night.terrainOpaque);
  const lightning = useLab((state) => state.night.lightning);

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
            opaque={night && terrainOpaque}
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

      {/* 번개는 구름과 따로 켠다. 반사 레이어에 올려 물웅덩이 속 퍼걸러도 같이 번쩍이게 한다 */}
      {lightning && (
        <ReflectLayer>
          <Lightning />
        </ReflectLayer>
      )}
    </>
  );
}
