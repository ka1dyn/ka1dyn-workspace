import { useTexture } from "@react-three/drei"
import { useMemo } from "react"
import * as THREE from "three"

export function Floor(props:any) {
    const [armMap, diffMap, normalMap] = useTexture([
        'textures/granite_tile_1k/granite_tile_arm_1k.jpg',
        'textures/granite_tile_1k/granite_tile_diff_1k.jpg', 
        'textures/granite_tile_1k/granite_tile_nor_gl_1k.png'])

    const floorMaterial = useMemo(() => {
      return new THREE.MeshStandardMaterial({
        map: diffMap,
        aoMap: armMap,
        roughnessMap: armMap,
        metalnessMap: armMap,
        normalMap,
        roughness: 0.5,
      })
    }, [armMap, diffMap, normalMap])

    return (
        <group {...props}>
            <mesh position={[0, 0.02, 0]} material={floorMaterial}>
            <boxGeometry args={[3.2,0.2,3.2]}/>
            </mesh>
        </group>
    )
}