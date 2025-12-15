import { OrbitControls, MeshReflectorMaterial, PerspectiveCamera, useTexture, useHelper } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Perf } from 'r3f-perf'
import { Rain } from "./components/Rain"
import { degToRad } from "three/src/math/MathUtils.js"
import { Suspense, useRef } from "react"
import { Post } from "./components/Post"
import Test from "./glb_components/Test"
import * as THREE from "three"

function Ground() {
  const [floor, normal] = useTexture(['textures/SurfaceImperfections003_1K_var1.jpg', 'textures/SurfaceImperfections003_1K_Normal.jpg'])
  const [colorMap, roughnessMap, normalMap, dispMap] = useTexture([
    'textures/aerial_rocks_01_1k/aerial_rocks_01_diff_1k.jpg',
    'textures/aerial_rocks_01_1k/aerial_rocks_01_rough_1k.png', 
    'textures/aerial_rocks_01_1k/aerial_rocks_01_nor_gl_1k.png',
    'textures/aerial_rocks_01_1k/aerial_rocks_01_disp_1k.png'])

  return (
    <mesh rotation={[degToRad(-90), 0, 0]}>
      <planeGeometry args={[20, 20, 32, 32]} />
      <MeshReflectorMaterial
              // color={"#777777"}
              // roughnessMap={floor}
              // normalMap={normal}
              map={colorMap}
              roughnessMap={roughnessMap}
              roughness={0.1}
              normalMap={normalMap}
              displacementMap={dispMap}
              displacementScale={0.5}
              displacementBias={-0.33}
              // normalScale={[1, 1]}
              // metalness={}
              // blur={[400, 100]} // Blur ground reflections (width, height), 0 skips blur
              // mixBlur={10} // How much blur mixes with surface roughness (default = 1)
              // mixStrength={0.8} // Strength of the reflections
              // mixContrast={1.4} // Contrast of the reflections
              // resolution={512} // Off-buffer resolution, lower=faster, higher=better quality, slower
              // mirror={0.5} // Mirror environment, 0 = texture colors, 1 = pick up env colors
              // depthScale={0} // Scale the depth factor (0 = no depth, default = 0)
              // minDepthThreshold={0.9} // Lower edge for the depthTexture interpolation (default = 0)
              // maxDepthThreshold={1} // Upper edge for the depthTexture interpolation (default = 0)
              // depthToBlurRatioBias={0.25} // Adds a bias factor to the depthTexture before calculating the blur amount [blurFactor = blurTexture * (depthTexture + bias)]. It accepts values between 0 and 1, default is 0.25. An amount > 0 of bias makes sure that the blurTexture is not too sharp because of the multiplication with the depthTexture
              // distortion={1} // Amount of distortion based on the distortionMap texture
              // // distortionMap={distortionTexture} // The red channel of this texture is used as the distortion map. Default is null
              // reflectorOffset={0.2} // Offsets the virtual camera that projects the reflection. Useful when the reflective surface is some distance from the object's origin (default = 0)
            
              blur={[400, 100]} // Blur ground reflections (width, height), 0 skips blur
              mixBlur={1} // How much blur mixes with surface roughness (default = 1)
              mixStrength={1} // Strength of the reflections
              mixContrast={1} // Contrast of the reflections
              resolution={512} // Off-buffer resolution, lower=faster, higher=better quality, slower
              mirror={0.5} // Mirror environment, 0 = texture colors, 1 = pick up env colors
              depthScale={0} // Scale the depth factor (0 = no depth, default = 0)
              minDepthThreshold={0.9} // Lower edge for the depthTexture interpolation (default = 0)
              maxDepthThreshold={1} // Upper edge for the depthTexture interpolation (default = 0)
              depthToBlurRatioBias={0.25} // Adds a bias factor to the depthTexture before calculating the blur amount [blurFactor = blurTexture * (depthTexture + bias)]. It accepts values between 0 and 1, default is 0.25. An amount > 0 of bias makes sure that the blurTexture is not too sharp because of the multiplication with the depthTexture
              distortion={3} // Amount of distortion based on the distortionMap texture
            />
    </mesh>
  )
}

function RainTest() {
  
  return (
    <>
    <Rain>
        <group dispose={null}>
          {/* Drei reflector */}
          
          {/* <mesh rotation={[-degToRad(90), 0, 0]}>
            <planeGeometry args={[10, 10]}/>
            <MeshReflectorMaterial
              color={"#777777"}
              blur={[0, 0]} // Blur ground reflections (width, height), 0 skips blur
              mixBlur={0} // How much blur mixes with surface roughness (default = 1)
              mixStrength={1} // Strength of the reflections
              mixContrast={1} // Contrast of the reflections
              resolution={256} // Off-buffer resolution, lower=faster, higher=better quality, slower
              mirror={0} // Mirror environment, 0 = texture colors, 1 = pick up env colors
              depthScale={0} // Scale the depth factor (0 = no depth, default = 0)
              minDepthThreshold={0.9} // Lower edge for the depthTexture interpolation (default = 0)
              maxDepthThreshold={1} // Upper edge for the depthTexture interpolation (default = 0)
              depthToBlurRatioBias={0.25} // Adds a bias factor to the depthTexture before calculating the blur amount [blurFactor = blurTexture * (depthTexture + bias)]. It accepts values between 0 and 1, default is 0.25. An amount > 0 of bias makes sure that the blurTexture is not too sharp because of the multiplication with the depthTexture
              distortion={1} // Amount of distortion based on the distortionMap texture
              // distortionMap={distortionTexture} // The red channel of this texture is used as the distortion map. Default is null
              reflectorOffset={0.2} // Offsets the virtual camera that projects the reflection. Useful when the reflective surface is some distance from the object's origin (default = 0)
            />
          </mesh> */}

          {/* <Test glb_path="/models/workspace2/workspace2_test.glb"/> */}
          {/* <Test glb_path="/models/rest/rest.glb"/> */}
          <Ground />
        </group>
        </Rain>
        
        {/* <mesh position={[0.3, 0.1, 0]} rotation={[degToRad(-90), 0, 0]} >
            <planeGeometry args={[5, 4]}/>
            <meshStandardMaterial color="grey"/>
        </mesh> */}
    </>
  )
}

function Light() {
  const lightRef = useRef<THREE.PointLight>(null!)
  const spotRef = useRef<THREE.SpotLight>(null!)

  useHelper(lightRef, THREE.PointLightHelper, 0.2, "hotpink")
  useHelper(spotRef, THREE.SpotLightHelper, "cyan")

  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight
        intensity={0.5}
        args={[0xffffff, 0xffffff, 1.0]}
        // color={"#57bcff"}
        color={"#2798f5"}
        position={[0, 1, 0]}
        groundColor={"white"}
      />
      {/* <pointLight 
        // ref={lightRef} 
        color="#d7a538" position={[2.45, 2.7, -0.85]} intensity={5}/> */}

      {/* <spotLight
        color="white"
        position={[2.45, 2.7, -0.85]}
        intensity={5}
        // ref={spotRef}
      /> */}

      <rectAreaLight
        width={2.8}       // Width of the light
        height={2.8}      // Height of the light
        intensity={5}   // Brightness
        // color="#ffdb97"   // Light color
        color="#f3c87d"
        position={[0, 2.5, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} // Face downward
      />
    </>
    
  )
}


function App() {return (
    <div id="canvas-container">
      <Canvas shadows>
        <Suspense>
          <axesHelper args={[5]} />
          <color attach="background" args={["#111111"]} />
          
          <OrbitControls
            makeDefault
            target={[0, 1, 0]}
            maxPolarAngle={Math.PI / 2}
            dampingFactor={0.05}
          />

           <RainTest />
           {/* <Ground /> */}
           <Light />

           <Post />

        </Suspense>
        
        {/* <Test glb_path="/models/workspace2/workspace2_test.glb" /> */}
        <Perf />
      </Canvas>
    </div>
  )
}

export default App
