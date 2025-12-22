import { Canvas } from "@react-three/fiber"
import { Suspense } from "react"
// import { Post } from "./components/Post"
import Lights from "@/3d-components/Lights.tsx"
import Models from "@/3d-components/Models.tsx"
import { AudioProvider, BackgroundBGM } from "@/3d-components/Sound.tsx"
import CameraControl from "../CameraControl"
import Helpers from "../Helpers"
import { Preload } from "@react-three/drei"

export default function Scene() {
    return (
        <Canvas 
            dpr={[1, 2]}
            gl={{
                powerPreference: 'high-performance',
                alpha: false,
                antialias: false,
                stencil: false,
                // depth: false,
        }}>
            <AudioProvider>
                <Suspense>
                    <color attach="background" args={["#0f0f0f"]} />
                    <BackgroundBGM />
                    <CameraControl />

                    <Models />
                    <Lights />
                    
                    {/* <Post /> */}
                </Suspense>

                <Preload all />
            </AudioProvider>
            {/* <Helpers /> */}
        </Canvas>

    )
}