import Test from "@/glb_components/Test";
import { degToRad } from "three/src/math/MathUtils.js";
import Screen from "./Screen";

export default function Mac() {
    return (
        <>
            <group name="mac" rotation={[0, degToRad(110), 0]} position={[0.15, 0.74, -0.4]}>
                <Test glb_path="/models/macbook/macbook_fix.glb" scale={0.15}  />
                <Screen rotation={[0, degToRad(-90), 0]} position={[0.162, 0.169, 0]}/>
            </group>
        </>
        
    )
}