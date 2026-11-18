import * as THREE from "three";
import { BASE_FOV, SCREEN_FILL } from "@/shared/constants/camera";

/**
 * Distance at which a halfW x halfH plane, facing the camera, fills `fill` of
 * the frame. Takes the larger of the two constraints so the plane stays fully
 * visible in both orientations: portrait binds on width, landscape on height.
 */
export function fitDistance(
  halfW: number,
  halfH: number,
  aspect: number,
  fov = BASE_FOV,
  fill = SCREEN_FILL,
) {
  const t = Math.tan(THREE.MathUtils.degToRad(fov) / 2);
  return Math.max(halfW / (fill * t * aspect), halfH / (fill * t));
}
