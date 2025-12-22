import { Splashes } from "./Rain/Splashes";
import Test from "../glb_components/Test";
import { GroundBase, RainGround } from "./Ground/TestGround";
import { Floor } from "./Floor";
import { degToRad } from "three/src/math/MathUtils.js";
import { RainClouds } from "./Cloud";
import Mac from "./Mac";

export default function Models() {
    
    return <>
        <group name="rain">
            <RainGround rotation={[0, degToRad(50), 0]}/>
            <Splashes>
                <Test glb_path="/models/pergola/pergola.glb"/>
            </Splashes>
        </group>
        <GroundBase position={[0, -0.03, 0]} rotation={[0, degToRad(50), 0]}/>
        
        <Test glb_path="/models/things/things.glb" />

        <Mac />

        <Floor />
        <RainClouds />
        
    </>
}