import { createContext, type RefObject } from "react";
import type { AudioListener } from "three";

export const AudioContext = createContext<RefObject<AudioListener> | null>(
  null,
);
