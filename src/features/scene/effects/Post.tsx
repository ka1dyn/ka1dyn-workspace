import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
} from "@react-three/postprocessing";
import type { EffectComposer as Composer } from "postprocessing";
import { useEffect, useRef } from "react";

export function Post() {
  // @react-three/postprocessing은 언마운트될 때 composer를 dispose하지 않는다.
  // 그대로 두면 껐다 켤 때마다 후처리 버퍼(약 260MB @3.8MP)가 GPU에 남아 쌓이므로 직접 해제한다.
  const composer = useRef<Composer>(null);
  useEffect(() => {
    const c = composer.current;
    return () => c?.dispose();
  }, []);

  return (
    <EffectComposer ref={composer}>
      <BrightnessContrast brightness={0.05} contrast={0.2} />
      <Bloom luminanceThreshold={2} mipmapBlur intensity={1} />
    </EffectComposer>
  );
}
