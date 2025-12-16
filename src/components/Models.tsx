import { Splashes } from "./Rain/Splashes";
import Test from "../glb_components/Test";
import { GroundBase, RainGround } from "./Ground/TestGround";
import { Floor } from "./Floor";
export default function Models() {

    return <>
        {/* Rain */}
        <group name="rain">
            <RainGround />
            <Splashes>
                <Test glb_path="/models/rest/rest.glb"/>
            </Splashes>
        </group>
        <GroundBase position={[0, -0.03, 0]}/>
        
        {/* Except ground reflection */}
        <Floor />

        
    </>
}