import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Perf } from 'r3f-perf'
import { Suspense, useRef } from "react"
// import { Post } from "./components/Post"
import Lights from "./components/Lights.tsx"
import Models from "./components/Models.tsx"
import { degToRad } from "three/src/math/MathUtils.js"
import { Clouds } from "./components/Cloud.tsx"

function App() {return (
    <div id="canvas-container">
      <Canvas dpr={1}>
          <Suspense>
          <color attach="background" args={["#0f0f0f"]} />
          
          <OrbitControls
            makeDefault
            target={[0, 1, 0]}
            maxPolarAngle={degToRad(89.5)}
            dampingFactor={0.05}
          />
          <PerspectiveCamera near={0.01} far={1000} fov={60} position={[0, 1, 6]} makeDefault />

          {/* <Models /> */}
          <Models />
          <Lights />
          <Clouds />
          {/* <Post /> */}

        </Suspense>
        

        {/* Helpers */}
        {/* <axesHelper args={[5]} /> */}
        <Perf />
      </Canvas>
    </div>
  )
}

export default App
