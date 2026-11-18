/**
 * Camera / screen framing constants.
 *
 * The monitor is a flat plane sitting on the camera's view axis, so its own
 * shape never distorts no matter how wide the FOV gets. What distorts is the
 * scene behind it. We therefore keep the FOV fixed and fit the monitor by
 * moving the camera instead.
 */

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

/** Vertical FOV used for the screen close-up. Never widened. */
export const BASE_FOV = 50;

/** Fraction of the frame the monitor should fill in its binding axis. */
export const SCREEN_FILL = 0.9;

/**
 * Upper bound for the overview pose's FOV compensation. Without it a portrait
 * phone lands at ~117deg vertical, which is 14mm ultra-wide territory.
 */
export const MAX_FOV = 65;

/** Aspect ratio the overview pose was composed for. */
export const BASE_ASPECT = 1.6;

/**
 * Ignore aspect changes smaller than this. Mobile browsers toggle the URL bar
 * constantly, which would otherwise make the camera breathe.
 */
export const ASPECT_EPSILON = 0.02;
