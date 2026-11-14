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
import { Post } from "./Post";
import { IS_LAB, IS_MSAA, useLab } from "@/lab/store";
import LabProbe from "@/lab/LabProbe";
import LabTools from "@/lab/LabTools";

export default function Scene() {
  const frameReady = useReady((state) => state.frameReady);
  const lowDpr = useOverlay((state) => state.lowDpr);
  const labDpr = useLab((state) => state.dpr);
  const labPost = useLab((state) => state.post);
  const labTool = useLab((state) => state.tool);
  const dpr =
    labDpr !== "default"
      ? labDpr
      : lowDpr
        ? 0.6
        : ([1, 1.5] as [number, number]);

  useEffect(() => {
    if (!frameReady) return;

    //  Suspense data loading finish
    console.log("Init frame ready");
  }, [frameReady]);

  return (
    <Canvas
      dpr={dpr}
      gl={{
        powerPreference: "high-performance",
        alpha: false,
        // 실험실에서 ?msaa를 붙이면 켠다 (기본은 끔)
        antialias: IS_MSAA,
        stencil: false,
        // depth: false,
      }}
      className="w-full"
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
          {labPost && <Post />}
        </Suspense>
      </AudioProvider>
      {/* <Helpers /> */}
      {IS_LAB && (
        <LabProbe gpuTimer={labTool !== "statsgl" && labTool !== "r3fperf"} />
      )}
      {IS_LAB && <LabTools />}
    </Canvas>
  );
}
