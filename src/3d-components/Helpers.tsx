import { StatsGl } from "@react-three/drei";
// import { Perf } from 'r3f-perf'

export default function Helpers() {
  return (
    <>
      <StatsGl trackGPU={true} className="absolute top-0 left-0 z-10000000" />
      {/* <axesHelper args={[5]} /> */}
      {/* <Perf /> */}
    </>
  );
}
