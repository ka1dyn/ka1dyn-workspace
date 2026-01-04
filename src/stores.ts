import {create} from 'zustand'
import type {  StartType, Wpos, CameraInitType, ReadyType, OverlayType } from './types/types'
import { Overlay } from './types/enums'

export const useStart = create<StartType>((set) => ({
    start: false,
    setStart: (newStart: boolean) => {
        set({start: newStart})
    }
}))

export const useReady = create<ReadyType>((set) => ({
    frameReady: false,
    textureReady: false,
    screenReady: false,
    setFrameReady: (newState: boolean) => {
        set({frameReady: newState})
    },
    setTextureReady: (newState: boolean) => {
        set({textureReady: newState})
    },
    setScreenReady: (newState: boolean) => {
        set({screenReady: newState})
    }
}))

export const useCameraInit = create<CameraInitType>((set) => ({
    target: {
        x: 0,
        y: 0,
        z: 0
    },
    pos: {
        x: 0,
        y: 0,
        z: 0,
    },
    setTarget: (newTarget: Wpos) => {
        set({target: {...newTarget}})
    },
    setPos: (newPos: Wpos) => {
        set({pos: {...newPos}})
    },
}))

export const useOverlay = create<OverlayType>((set) => ({
    active: false,
    type: Overlay.DEFAULT,
    setActive: (newActive: boolean) => {
       set({active: newActive})
    },
    setType: (newType: Overlay) => {
        set({type: newType})
    }
}))