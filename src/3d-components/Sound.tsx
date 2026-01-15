import { useOverlay, useStart, useTweaks } from "@/stores";
import { useThree } from "@react-three/fiber";
import { OverlayTypes } from "@/types/enums";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Audio, AudioListener, AudioLoader } from "three";
import { useShallow } from "zustand/shallow";
import {
  fadeIn,
  fadeInAndPlay,
  fadeOut,
  fadeOutAndPause,
} from "@/utils/soundEffect";

export const AudioContext = createContext<RefObject<AudioListener> | null>(
  null,
);

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

export function useSound(audioPath: string, loop: boolean = false) {
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
      sound.setVolume(0.5);

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

export function BackgroundBGM() {
  const { soundRef: rainSound, isReady: rainReady } = useSound(
    "audio/rain.mp3",
    true,
  );
  const { soundRef: bgSound, isReady: bgReady } = useSound(
    "audio/background.mp3",
    true,
  );
  const { active, type } = useOverlay(
    useShallow((state) => ({
      active: state.active,
      type: state.type,
    })),
  );

  const audioActive = useTweaks((state) => state.audioActive);
  const start = useStart((state) => state.start);

  useEffect(() => {
    if (!rainReady || !bgReady || !start) return;
    if (audioActive) {
      fadeIn(bgSound.current, 1);
      fadeIn(rainSound.current, 1);
    } else {
      fadeOut(bgSound.current, 1);
      fadeOut(rainSound.current, 1);
    }
  }, [audioActive]);

  useEffect(() => {
    if (!rainReady || !start) return;

    rainSound.current.play();
  }, [rainSound, start]);

  useEffect(() => {
    if (!bgReady || !start) return;

    if (type == OverlayTypes.DEFAULT) {
      fadeInAndPlay(bgSound.current);
    } else if (type == OverlayTypes.SCREEN) {
      fadeOutAndPause(bgSound.current);
    }
  }, [type, bgSound]);

  return null;
}
