import {create} from 'zustand'
import type {  StartType, Wpos, CameraInitType, ReadyType } from './types/types'

export const useStart = create<StartType>((set) => ({
    start: false,
    setStart: (newStart: boolean) => {
        set({start: newStart})
    }
}))

export const useReady = create<ReadyType>((set) => ({
    frameReady: false,
    textureReady: false,
    setFrameReady: (newState: boolean) => {
        set({frameReady: newState})
    },
    setTextureReady: (newState: boolean) => {
        set({textureReady: newState})
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
    }
}))
