import { Splashes } from "./Rain/Splashes";
import Test from "../glb_components/Test";
import { GroundBase, RainGround } from "./Ground/TestGround";
import { Floor } from "./Floor";
import { degToRad } from "three/src/math/MathUtils.js";
import { RainClouds } from "./Cloud";
export default function Models() {

    return <>
        {/* Rain */}
        <group name="rain">
            <RainGround rotation={[0, degToRad(50), 0]}/>
            <Splashes>
                <Test glb_path="/models/rest/rest.glb"/>
            </Splashes>
        </group>
        <GroundBase position={[0, -0.02, 0]} rotation={[0, degToRad(50), 0]}/>
        
        <Test glb_path="/models/things/things.glb"/>

        <Floor />
        <RainClouds />
        
    </>
}