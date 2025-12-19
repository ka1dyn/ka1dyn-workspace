import { OrbitControls, PerspectiveCamera, StatsGl } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
// import { Perf } from 'r3f-perf'
import { Suspense } from "react"
// import { Post } from "./components/Post"
import Lights from "@/3d-components/Lights.tsx"
import Models from "@/3d-components/Models.tsx"
import { degToRad } from "three/src/math/MathUtils.js"
import { AudioProvider, BackgroundBGM } from "@/3d-components/Sound.tsx"

export default function Scene() {
    return (
        <div className="w-screen h-screen">
            <Canvas dpr={1}>
                <StatsGl trackGPU={true} className="absolute top-0 left-0 z-10000000"/>
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