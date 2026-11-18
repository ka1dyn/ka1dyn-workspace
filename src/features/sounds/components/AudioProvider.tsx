import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { AudioListener } from "three";
import { AudioContext } from "../context";

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const { camera } = useThree();
  const listenerRef = useRef<AudioListener>(null!);

  useEffect(() => {
    const listener = new AudioListener();
    listenerRef.current = listener;

    camera.add(listener);
  }, [camera]);

  return (
    <AudioContext.Provider value={listenerRef}>
      {children}
    </AudioContext.Provider>
  );
}
