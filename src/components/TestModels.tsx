import { Splashes } from "./Rain/Splashes";
import Test from "../glb_components/Test";
import { GroundBase, RainGround } from "./Ground/TestGround";
export default function TestModels() {

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
        <group>
            <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[3.2,0.2,3.2]}/>
            <meshStandardMaterial 
                color="grey"
                metalness={0.1}
                roughness={0.5}
            />
            </mesh>
        </group>

        
    </>
}