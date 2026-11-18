import { useReady } from "@/stores";
import { useFrame } from "@react-three/fiber";
import { useShallow } from "zustand/shallow";

export default function FrameDetector() {
  const { frameReady, setFrameReady } = useReady(
    useShallow((state) => ({
      frameReady: state.frameReady,
      setFrameReady: state.setFrameReady,
    })),
  );

  useFrame(() => {
    if (frameReady) return;
    setFrameReady(true);
  });

  return <></>;
}
