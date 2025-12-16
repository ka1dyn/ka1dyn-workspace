import { MeshReflectorMaterial, useTexture } from "@react-three/drei"
import { useMemo } from "react"
import * as THREE from "three"
import { degToRad } from "three/src/math/MathUtils.js"
import { Drops } from "../Rain/Drops"
import { Splashes } from "../Rain/Splashes"

export function GroundBase(props:any) {
    const [colorMap, roughnessMap, normalMap, dispMap] = useTexture([
        'textures/aerial_rocks_01_1k/aerial_rocks_01_diff_1k.jpg',
        'textures/aerial_rocks_01_1k/aerial_rocks_01_rough_1k.png', 
        'textures/aerial_rocks_01_1k/aerial_rocks_01_nor_gl_1k.png',
        'textures/aerial_rocks_01_1k/aerial_rocks_01_disp_1k.png'])

    const [alphaMap] = useTexture([
        'textures/alpha.jpg'])

    const rockMaterial = useMemo(() => {
      return new THREE.MeshStandardMaterial({
        transparent: true,
        map: colorMap,
        alphaMap: alphaMap,
        roughnessMap,
        normalMap,
        displacementMap: dispMap,
        displacementScale: 0.4,
        displacementBias: -0.15,
        metalness: 0.5,
        roughness: 0.2,
      })
    }, [colorMap, roughnessMap, normalMap, dispMap])

    return (
        <group {...props}>
            <mesh rotation={[degToRad(-90), 0, 0]} material={rockMaterial}>
            <planeGeometry args={[10,10,64,64]}/>
        </mesh>
        </group>
    )
}

export function RainGround({props}:any) {
    const [roughnessMap] = useTexture([
        'textures/aerial_rocks_01_1k/aerial_rocks_01_rough_1k.png'])
    
        const [alphaMap] = useTexture([
        'textures/alpha.jpg'])

   return (
    <group {...props}>
        <mesh rotation={[degToRad(-90), 0, 0]}>
            <planeGeometry args={[10,10,1,1]}/>
            <MeshReflectorMaterial
                roughnessMap={roughnessMap}
                // normalMap={normalMap}
                color={'#ffffff'}
                opacity={0.3}
                transparent={true}
                alphaMap={alphaMap}
                blur={[256, 256]} // Blur ground reflections (width, height), 0 skips blur
                mixBlur={1.1} // How much blur mixes with surface roughness (default = 1)
                mixStrength={10} // Strength of the reflections
                mixContrast={1.01} // Contrast of the reflections
                resolution={512} // Off-buffer resolution, lower=faster, higher=better quality, slower
                mirror={1} // Mirror environment, 0 = texture colors, 1 = pick up env colors
                depthScale={0} // Scale the depth factor (0 = no depth, default = 0)
                minDepthThreshold={0.9} // Lower edge for the depthTexture interpolation (default = 0)
                maxDepthThreshold={1} // Upper edge for the depthTexture interpolation (default = 0)
                depthToBlurRatioBias={0.25} // Adds a bias factor to the depthTexture before calculating the blur amount [blurFactor = blurTexture * (depthTexture + bias)]. It accepts values between 0 and 1, default is 0.25. An amount > 0 of bias makes sure that the blurTexture is not too sharp because of the multiplication with the depthTexture
                // distortion={0} // Amount of distortion based on the distortionMap texture
                // distortionMap={distortionTexture} // The red channel of this texture is used as the distortion map. Default is null
                reflectorOffset={0.2} // Offsets the virtual camera that projects the reflection. Useful when the reflective surface is some distance from the object's origin (default = 0)
            />

            <Drops rotation={[degToRad(90), 0, 0]}/>

            <Splashes count={300} rotation={[degToRad(90), 0, 0]}>
                <mesh position={[0, 0, 0.01]}>
                    <planeGeometry args={[10,10,1,1]}/>
                    <meshBasicMaterial 
                        color="white"
                        transparent={true}
                        opacity={0}
                    />
                </mesh>
            </Splashes>
        </mesh>
    </group>
   )
    
}