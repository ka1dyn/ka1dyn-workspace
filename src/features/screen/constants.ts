/** Monitor (drei <Html>) size constants. Camera framing lives in shared/constants/camera.ts. */

/** Html layout size, in CSS px. Applied directly in Screen.tsx. */
export const SCREEN_PX = { w: 2560, h: 1700 } as const;

/** drei <Html transform> distanceFactor. */
export const SCREEN_DISTANCE_FACTOR = 0.069;

/** drei converts CSS px to world units by distanceFactor / 400. */
export const PX_TO_WORLD = SCREEN_DISTANCE_FACTOR / 400;

/** Monitor size in world units: 0.4416 x 0.2933 (aspect 1.506). */
export const SCREEN_WORLD = {
  w: SCREEN_PX.w * PX_TO_WORLD,
  h: SCREEN_PX.h * PX_TO_WORLD,
} as const;

/**
 * Ignore aspect changes smaller than this. Mobile browsers toggle the URL bar
 * constantly, which would otherwise make the camera breathe.
 */
export const ASPECT_EPSILON = 0.02;
