import { useRef } from "react";
import * as THREE from "three";
import { Splashes } from "./Rain/Splashes";
import Test from "../glb_components/Test";
import { GroundBasic, RainGround } from "./Ground/TestGround";
import { Drops } from "./Rain/Drops";

export default function TestModels() {
    
    // Rain

    return <>

        {/* Rain */}
        <group name="rain">
            <Drops/>
            <Splashes count={300}>
                <RainGround />
            </Splashes>
            <Splashes>
                <Test glb_path="/models/rest/rest.glb"/>
            </Splashes>
        </group>
        <GroundBasic position={[0, -0.03, 0]}/>
        
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