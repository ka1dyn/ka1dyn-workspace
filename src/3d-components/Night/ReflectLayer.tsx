import { useLayoutEffect, useRef, type PropsWithChildren } from "react";
import * as THREE from "three";
import { REFLECT_LAYER } from "./constants";

// 자식 전체(메시·조명 포함)를 반사 레이어에도 올린다. 메인 카메라가 보는 레이어 0은 그대로 둔다.
// three는 조명도 카메라 레이어로 거르므로, 반사에서 PBR 재질이 빛을 받으려면 조명도 이 레이어에 있어야 한다.
// GLB가 늦게 붙어도 반영되도록 렌더마다 다시 훑는다 (자식 수가 적어 비용이 작다).
export default function ReflectLayer({ children }: PropsWithChildren) {
  const group = useRef<THREE.Group>(null!);
  useLayoutEffect(() => {
    group.current.traverse((o) => o.layers.enable(REFLECT_LAYER));
  });
  return <group ref={group}>{children}</group>;
}
