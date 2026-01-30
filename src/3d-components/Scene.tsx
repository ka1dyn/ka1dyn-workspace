import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
// import { Post } from "./components/Post"
import Lights from "@/3d-components/Lights.tsx";
import Models from "@/3d-components/Models.tsx";
import { AudioProvider, BackgroundBGM } from "@/3d-components/Sound.tsx";
import CameraControl from "./CameraControl";
import Helpers from "./Helpers";
import FrameDetector from "./FrameDetector";
import { useOverlay, useReady } from "@/stores";
import StartAnimaion from "./StartAnimaion";

export default function Scene() {
  const frameReady = useReady((state) => state.frameReady);
  const lowDpr = useOverlay((state) => state.lowDpr);

  useEffect(() => {
    if (!frameReady) return;

    //  Suspense data loading finish
    console.log("Init frame ready");
  }, [frameReady]);

  return (
    <Canvas
      dpr={lowDpr ? 0.6 : [1, 2]}
      gl={{
        powerPreference: "high-performance",
        alpha: false,
        antialias: false,
        stencil: false,
        // depth: false,
      }}
    >
      <AudioProvider>
        <Suspense>
          <color attach="background" args={["#0f0f0f"]} />
          <BackgroundBGM />
          <CameraControl />
          <StartAnimaion />

          <Models />
          <Lights />

          {/* Scene Ready detection */}
          {!frameReady && <FrameDetector />}

          {/* <Post /> */}
        </Suspense>
      </AudioProvider>
      <Helpers />
    </Canvas>
  );
}
