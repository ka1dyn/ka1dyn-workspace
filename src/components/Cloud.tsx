import { Cloud } from "@react-three/drei";
// import { isDesktop } from "react-device-detect";

export function Clouds() {
  return (
    <>
      <Cloud
        bounds={[1, 5, 5]}
        segments={40}
        position={[-10, 0, 0]}
        color="#2c2c2c"
        opacity={0.2}
      />
      <Cloud
        bounds={[1, 5, 5]}
        position={[10, 0, 0]}
        color="#2c2c2c"
        opacity={0.2}
      />
      <Cloud
        bounds={[1, 5, 1]}
        position={[0, 0, 10]}
        color="#2c2c2c"
        opacity={0.2}
      />
      <Cloud
        bounds={[1, 5, 1]}
        position={[0, 0, -10]}
        color="#2c2c2c"
        opacity={0.2}
      />
    </>
  );
}
