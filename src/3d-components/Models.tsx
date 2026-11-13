import { Splashes } from "./Rain/Splashes";
import Test from "../glb_components/Test";
import { GroundBase, RainGround } from "./Ground/TestGround";
import { Floor } from "./Floor";
import { degToRad } from "three/src/math/MathUtils.js";
import { RainClouds } from "./Cloud";
import Mac from "./Mac";
import { useLab } from "@/lab/store";
import NightScene from "./Night";

export default function Models() {
  const m = useLab((state) => state.models);
  const night = useLab((state) => state.night.scene === "night");

  return (
    <>
      <group name="rain">
        {!night && m.rainGround && (
          <RainGround rotation={[0, degToRad(50), 0]} />
        )}
        {m.pergola && (
          <Splashes>
            <Test glb_path="/models/pergola/pergola.glb" />
          </Splashes>
        )}
      </group>
      {night && <NightScene />}
      {!night && m.groundBase && (
        <GroundBase position={[0, -0.03, 0]} rotation={[0, degToRad(50), 0]} />
      )}

      {m.things && <Test glb_path="/models/things/things.glb" />}

      {m.mac && <Mac />}

      {m.floor && <Floor />}
      {m.clouds && <RainClouds />}
    </>
  );
}
