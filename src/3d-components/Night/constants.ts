import * as THREE from "three";

// 전체 장면 카메라(7.5, 2, 6 → 원점)에서 정면 약간 왼쪽 위에 달이 보이도록 잡은 방향
export const MOON_DIR = new THREE.Vector3(-0.72, 0.28, -0.62).normalize();

export const FOG_COLOR = "#0a1020";
export const FOG_NEAR = 6;
export const FOG_FAR = 24;

// 반사 카메라가 그리는 레이어. 하늘·달·퍼걸러·맥북 몸체·조명을 여기에 둔다.
export const REFLECT_LAYER = 1;
// 반사에 잔디를 넣을지는 토글로 정하므로 따로 둔다.
export const GRASS_LAYER = 2;
