import * as THREE from "three";
import { BASE_ASPECT, BASE_FOV, MAX_FOV } from "../constants/camera";

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
