import * as THREE from "three";

// 달 방향. 실험실 "달 방위·고도"에서 바꿀 수 있어 값을 제자리에서 고친다
// (하늘 셰이더 uniform이 이 객체를 그대로 참조한다).
export const MOON_DIR = new THREE.Vector3();

/** 방위(°, atan2(z, x) 기준)와 고도(°)로 달 방향을 정한다 */
export function setMoonDir(azDeg: number, elDeg: number) {
  const az = THREE.MathUtils.degToRad(azDeg);
  const el = THREE.MathUtils.degToRad(elDeg);
  MOON_DIR.set(
    Math.cos(el) * Math.cos(az),
    Math.sin(el),
    Math.cos(el) * Math.sin(az),
  );
  return MOON_DIR;
}
setMoonDir(-143, 18.5);

export const FOG_COLOR = "#0a1020";
export const FOG_NEAR = 6;
export const FOG_FAR = 24;

// 반사 카메라가 그리는 레이어. 하늘·달·퍼걸러·맥북 몸체·조명을 여기에 둔다.
export const REFLECT_LAYER = 1;
// 반사에 잔디를 넣을지는 토글로 정하므로 따로 둔다.
export const GRASS_LAYER = 2;
