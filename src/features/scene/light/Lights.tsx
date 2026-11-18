import { useLab } from "@/features/lab/store";
import { Environment, Lightformer } from "@react-three/drei";
import { memo } from "react";
import NightLights from "./NightLights";
import ReflectLayer from "../components/ReflectLayer";

// 달빛과 등 하나. 환경맵은 PBR 재질(퍼걸러·맥북)이 너무 검지 않도록 약하게만 남긴다.
export default function Lights() {
  // 필요한 값만 구독한다. 스토어 전체를 구독하면 패널의 어떤 토글에도 다시 렌더링된다.
  const environment = useLab((state) => state.environment);

  return (
    <>
      <ReflectLayer>
        <NightLights />
      </ReflectLayer>
      {environment && <StudioEnvironment intensity={0.12} />}
    </>
  );
}

// Environment를 분리해 memo로 고정한다.
// Lights가 다시 렌더링될 때(실험실 토글) Lightformer 자식이 새 JSX로 넘어가면
// drei Environment(frames=1)가 큐브맵 6면을 다시 그리고 PMREM을 재생성한다.
// props가 숫자 하나뿐인 memo 컴포넌트라 부모가 다시 렌더링돼도 자식이 바뀌지 않는다.
const StudioEnvironment = memo(function StudioEnvironment({
  intensity = 1,
}: {
  intensity?: number;
}) {
  return (
    <Environment frames={1} environmentIntensity={intensity}>
      {/* Front */}

      <Lightformer
        form="circle"
        rotation-y={Math.PI / 2}
        position={[-5, 3, 4]}
        scale={[0.5, 0.5, 1]}
        intensity={5}
        color="#ffedb1"
      />
      <Lightformer
        rotation-y={Math.PI / 2}
        position={[-5, 2, 1]}
        scale={[0.5, 0.25, 1]}
        intensity={3}
        color="#ffedb1"
      />
      <Lightformer
        form="circle"
        rotation-y={Math.PI / 2}
        position={[-5, 2, 0]}
        scale={[0.5, 0.5, 1]}
        intensity={2}
        color="#cdceff"
      />

      {/* Back */}

      <Lightformer
        rotation-y={Math.PI / 2}
        position={[5, 5, 5]}
        scale={[0.5, 5, 1]}
        intensity={1}
        color="#fff"
      />
      <Lightformer
        rotation-y={Math.PI / 2}
        position={[5, 5, 3]}
        scale={[0.5, 5, 1]}
        intensity={1.5}
        color="#fff"
      />
      <Lightformer
        rotation-y={Math.PI / 2}
        position={[5, 5, 0]}
        scale={[0.5, 5, 1]}
        intensity={1}
        color="#fff"
      />

      {/* Sides */}
      <Lightformer
        position={[0, 5, 5]}
        scale={[0.5, 3, 1]}
        intensity={1.5}
        color="#fff"
      />
      <Lightformer
        position={[0, 5, -5]}
        scale={[0.5, 3, 1]}
        intensity={1.5}
        color="#fff"
      />
    </Environment>
  );
});
