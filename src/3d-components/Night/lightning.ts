import * as THREE from "three";

// 번개 섬광 세기 (0 = 없음, 1 ≈ 가장 센 번쩍임). Lightning.tsx가 매 프레임 값을 고친다.
// 잔디·수면·하늘 셰이더는 조명을 받지 않으므로 이 객체를 uniform으로 그대로 공유해서 직접 밝힌다
// (재질마다 값을 복사하지 않아도 같은 프레임에 모두 반영된다. MOON_DIR과 같은 방식).
export const LIGHTNING = { value: 0 };

// 번개 빛 색. 씬 라이트(pointLight)와 셰이더가 같은 색을 쓴다.
export const LIGHTNING_HEX = "#d4d0ff";
export const LIGHTNING_COLOR = new THREE.Color(LIGHTNING_HEX);

/** 셰이더 재질 uniforms에 펼쳐 넣는다: uFlash(세기), uFlashColor(색) */
export function lightningUniforms() {
  return {
    uFlash: LIGHTNING,
    uFlashColor: { value: LIGHTNING_COLOR },
  };
}
