import { Canvas } from "@react-three/fiber";
import { lazy, Suspense, useEffect } from "react";
// import { Post } from "./components/Post"
import Lights from "@/features/scene/light/Lights";
import Models from "@/features/scene/Models";
import { AudioProvider, BackgroundBGM } from "@/features/sounds/components/Sound";
import CameraControl from "./CameraControl";
import Helpers from "./utils/Helpers";
import FrameDetector from "./utils/FrameDetector";
import { useOverlay, useReady, useStart, useTweaks } from "@/stores";
import StartAnimaion from "../intro/StartAnimaion";
import { Post } from "./effects/Post";
import { IS_LAB, IS_MSAA, useLab } from "@/features/lab/store";

// 실험실 도구(stats-gl, r3f-perf 포함)는 ?lab일 때만 내려받는다
const LabProbe = lazy(() => import("@/features/lab/components/LabProbe"));
const LabTools = lazy(() => import("@/features/lab/components/LabTools"));

export default function Scene() {
  const frameReady = useReady((state) => state.frameReady);
  const lowDpr = useOverlay((state) => state.lowDpr);
  const labDpr = useLab((state) => state.dpr);
  const labPost = useLab((state) => state.post);
  const labTool = useLab((state) => state.tool);
  const labPause = useLab((state) => state.pause);
  const start = useStart((state) => state.start);
  const dive = useTweaks((state) => state.dive);
  // 캔버스가 완전히 가려져 있는 동안은 그리지 않는다:
  //   - 시작 화면: 첫 프레임(셰이더 컴파일·텍스처 올리기)이 끝난 뒤 start를 누르기 전까지
  //   - dive: 맥북 화면 DOM이 창 전체를 덮고 있는 동안
  // "demand"는 무언가 바뀌어 invalidate될 때만 그리므로, 창 크기 변경이나 상태 변경은 계속 반영된다.
  const covered = (!start && frameReady) || dive;
  const frameloop = labPause && covered ? "demand" : "always";
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
      frameloop={frameloop}
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
        <Suspense fallback={null}>
          <LabProbe gpuTimer={labTool !== "statsgl" && labTool !== "r3fperf"} />
          <LabTools />
        </Suspense>
      )}
    </Canvas>
  );
}
