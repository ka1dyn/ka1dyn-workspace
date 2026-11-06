import { StatsGl } from "@react-three/drei";
// import { Perf } from "r3f-perf";
// import GpuTimer from "./GpuTimer";

// NOTE: GpuTimer, StatsGl(trackGPU) and Perf all use the WebGL2 TIME_ELAPSED query.
// Only one can be active at a time, so enable only one of them when measuring GPU time.
export default function Helpers() {
  return (
    <>
      <StatsGl trackGPU={true} className="absolute top-0 left-0 z-10000000" />
      {/* <axesHelper args={[5]} /> */}
      {/* <Perf style={{ zIndex: 10000002 }} /> */}
      {/* <GpuTimer /> */}
    </>
  );
}
