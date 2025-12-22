// Store types

export interface StartType {
    start: boolean;
    setStart: (newStart: boolean) => void;
}

export interface CameraInitType {
    target: Wpos,
    pos: Wpos,
    setTarget: (newTarget: Wpos) => void,
    setPos: (newPos: Wpos) => void
}

/* General types */

// world position
export interface Wpos {
    x: number,
    y: number,
    z: number
}
