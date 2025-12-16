import { useRef } from "react";
import * as THREE from "three";
import { Drops } from "./Rain/Drops";
import { Splashes } from "./Rain/Splashes";
import { Ground } from "./Ground";
import Test from "../glb_components/Test";

export default function TmpModels() {
    
    // Rain
    const splashRef = useRef<THREE.Group>(null!);
    const dropsRef = useRef<THREE.Group>(null!);
    const exceptReflectGroup = useRef<THREE.Group>(null!);

    return <>

        {/* Rain */}
        <group name="rain">
            <Drops ref={dropsRef}/>
            <Splashes ref={splashRef} count={100}>
                <Ground dropsRef={dropsRef} splashRef={splashRef} exceptRef={splashRef} />
            </Splashes>
            <Splashes>
                <Test glb_path="/models/rest/rest.glb"/>
            </Splashes>
        </group>

        {/* <Ground dropsRef={dropsRef} splashRef={splashRef} exceptRef={splashRef} /> */}
        
        
        {/* Except ground reflection */}
        <group ref={exceptReflectGroup}>
            <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[3.2,0.1,3.2]}/>
            <meshStandardMaterial 
                color="grey"
                metalness={0.1}
                roughness={0.5}
            />
            </mesh>
        </group>



        

        
    </>
}