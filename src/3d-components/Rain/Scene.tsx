import { OrbitControls, PerspectiveCamera, StatsGl } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Perf } from 'r3f-perf'
import { Suspense } from "react"
// import { Post } from "./components/Post"
import Lights from "@/3d-components/Lights.tsx"
import Models from "@/3d-components/Models.tsx"
import { degToRad } from "three/src/math/MathUtils.js"
import { AudioProvider, BackgroundBGM } from "@/3d-components/Sound.tsx"
import Screen from "@/3d-components/Screen"

export default function Scene() {
    return (
        <div id="canvas-container">
            <Canvas dpr={1}>
                <StatsGl trackGPU={true}/>
                <AudioProvider>
                <Suspense>
                    <color attach="background" args={["#0f0f0f"]} />
                    <BackgroundBGM />
                    
                    <OrbitControls
                    makeDefault
                    target={[0, 1, 0]}
                    maxPolarAngle={degToRad(89.5)}
                    dampingFactor={0.05}
                    />
                    <PerspectiveCamera near={0.01} far={1000} fov={60} position={[0, 1, 6]} makeDefault />

                    <Models />
                    <Lights />

                    {/* Computer screen */}
                    <Screen />
                    
                    {/* <Post /> */}

                </Suspense>
                </AudioProvider>

                {/* Helpers */}
                {/* <axesHelper args={[5]} /> */}
                {/* <Perf /> */}
            </Canvas>
    </div>
    )
}