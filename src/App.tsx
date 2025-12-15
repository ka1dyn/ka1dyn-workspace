import { OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Perf } from 'r3f-perf'
import { Rain } from "./components/Rain"
import { Suspense } from "react"
import { Post } from "./components/Post"
import Test from "./glb_components/Test"
import { Ground } from "./components/Ground"
import Lights from "./components/Lights.tsx"

function RainTest() {
  
  return (
    <>
    <Rain>
        <group dispose={null}>
          {/* <Test glb_path="/models/workspace2/workspace2_test.glb"/> */}
          <Test glb_path="/models/rest/rest.glb"/>
          <Ground />
        </group>
        </Rain>
    </>
  )
}

function App() {return (
    <div id="canvas-container">
      <Canvas>
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

           <Lights />
           <Post />

        </Suspense>
        <Perf />
      </Canvas>
    </div>
  )
}

export default App
