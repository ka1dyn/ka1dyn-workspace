import { useTexture } from "@react-three/drei"
import { useMemo } from "react"
import * as THREE from "three"
import { degToRad } from "three/src/math/MathUtils.js"

export default function TestGround() {
    const [colorMap, roughnessMap, normalMap, dispMap] = useTexture([
        'textures/aerial_rocks_01_1k/aerial_rocks_01_diff_1k.jpg',
        'textures/aerial_rocks_01_1k/aerial_rocks_01_rough_1k.png', 
        'textures/aerial_rocks_01_1k/aerial_rocks_01_nor_gl_1k.png',
        'textures/aerial_rocks_01_1k/aerial_rocks_01_disp_1k.png'])

    const rockMaterial = useMemo(() => {
      return new THREE.MeshStandardMaterial({
        map: colorMap,
        roughnessMap,
        normalMap,
        displacementMap: dispMap,
        displacementScale: 0.2,
        displacementBias: -0.06,
        metalness: 0,
        roughness: 0.2,
      })
    }, [colorMap, roughnessMap, normalMap, dispMap])

    return <>
        <mesh rotation={[degToRad(-90), 0, 0]} material={rockMaterial}>
            <planeGeometry args={[10,10,64, 64]}/>
        </mesh>
    </>
}