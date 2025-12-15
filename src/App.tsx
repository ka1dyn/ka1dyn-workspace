import { OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Perf } from 'r3f-perf'
import { Suspense, useRef } from "react"
import { Post } from "./components/Post"
import Lights from "./components/Lights.tsx"
import Models from "./components/Models.tsx"

function App() {return (
    <div id="canvas-container">
      <Canvas dpr={1}>
          <Suspense>
          <color attach="background" args={["#111111"]} />
          
          <OrbitControls
            makeDefault
            target={[0, 1, 0]}
            maxPolarAngle={Math.PI / 2}
            dampingFactor={0.05}
          />

          <Models />
          <Lights />
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
