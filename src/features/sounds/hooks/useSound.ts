import { useContext, useEffect, useRef, useState } from "react";
import { Audio, AudioLoader } from "three";
import { AudioContext } from "../context";

export function useSound(
  audioPath: string,
  loop: boolean = false,
  initVol: number = 0.5,
) {
  const [loaded, setLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const audioListener = useContext(AudioContext);
  const soundRef = useRef<Audio>(null!);

  useEffect(() => {
    if (!audioListener) return;

    const listener = audioListener.current;

    const sound = new Audio(listener);
    soundRef.current = sound;

    const audioLoader = new AudioLoader();
    audioLoader.load(audioPath, (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(loop);
      sound.setVolume(initVol);

      setLoaded(true);
    });

    return () => {
      sound.stop();
    };
  }, [audioListener]);

  useEffect(() => {
    if (!loaded) return;

    const handleClick = () => {
      setIsReady(true);
    };

    // For browser policy
    window.addEventListener("click", handleClick, { once: true });

    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, [loaded]);

  return { soundRef, isReady };
}
