import { OrbitControls, PerspectiveCamera, StatsGl } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
// import { Perf } from 'r3f-perf'
import { Suspense, useEffect } from "react"
// import { Post } from "./components/Post"
import Lights from "@/3d-components/Lights.tsx"
import Models from "@/3d-components/Models.tsx"
import { degToRad } from "three/src/math/MathUtils.js"
import { AudioProvider, BackgroundBGM } from "@/3d-components/Sound.tsx"
import { folder, useControls } from "leva"
import { useCameraInit } from "@/stores"
import { useShallow } from "zustand/shallow"

export default function Scene() {

    // Set Camera init position
    const {target, pos} = useCameraInit(useShallow((state) => ({
        target: state.target,
        pos: state.pos
    })))

    // Set leva
    const [{tx, ty, tz, px, py, pz}, set] = useControls(() => ({
        'target': folder({
            tx: {value: 0, min: -5, max: 5, step: 0.01},
            ty: {value: 0, min: -5, max: 5, step: 0.01},
            tz: {value: 0, min: -5, max: 5, step: 0.01},
        }),
        'position': folder({
            px: {value: 0, min: -5, max: 5, step: 0.01},
            py: {value: 0, min: -5, max: 5, step: 0.01},
            pz: {value: 0, min: -5, max: 5, step: 0.01},
        })
    }))

    useEffect(() => {
        set({
            tx: target.x,
            ty: target.y,
            tz: target.z,
            px: pos.x,
            py: pos.y,
            pz: pos.z
        })
    }, [target, pos, set])

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
                        target={[tx, ty, tz]}
                        maxPolarAngle={degToRad(89.5)}
                        dampingFactor={0.05}
                    />
                    <PerspectiveCamera near={0.01} far={50} fov={50} position={[px, py, pz]} makeDefault />

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