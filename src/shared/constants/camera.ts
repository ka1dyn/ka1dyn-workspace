/**
 * Camera / screen framing constants.
 *
 * The monitor is a flat plane sitting on the camera's view axis, so its own
 * shape never distorts no matter how wide the FOV gets. What distorts is the
 * scene behind it. We therefore keep the FOV fixed and fit the monitor by
 * moving the camera instead.
 */

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
