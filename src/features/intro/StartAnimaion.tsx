import useCameraAnim from "@/shared/hooks/useCameraAnim";
import { useStart } from "@/shared/stores";
import { useEffect } from "react";

export default function StartAnimation() {
  const start = useStart((state) => state.start);
  const { startAnimation } = useCameraAnim();

  useEffect(() => {
    if (!start) return;

    startAnimation();
  }, [start]);

  return <></>;
}
