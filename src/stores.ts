import {create} from 'zustand'
import type { StartType } from './types'

export const useStart = create<StartType>((set) => ({
    start: false,
    setStart: (newStart: boolean) => {
        set({start: newStart})
    }
}))