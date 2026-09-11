import * as THREE from "three";
import { BASE_ASPECT, BASE_FOV, MAX_FOV, SCREEN_FILL } from "@/constants/camera";

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

/**
 * Vertical FOV for the overview pose. Preserves the horizontal framing authored
 * at BASE_ASPECT as the viewport narrows, but clamped so it never reaches the
 * fisheye range. Past the clamp the room simply crops.
 */
export function overviewFov(aspect: number) {
  if (aspect >= BASE_ASPECT) return BASE_FOV;

  const hFov =
    2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(BASE_FOV) / 2) * BASE_ASPECT);
  const vFov = THREE.MathUtils.radToDeg(
    2 * Math.atan(Math.tan(hFov / 2) / aspect),
  );

  return THREE.MathUtils.clamp(vFov, BASE_FOV, MAX_FOV);
}
