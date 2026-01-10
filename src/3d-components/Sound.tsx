import { useOverlay, useStart } from "@/stores";
import { useThree } from "@react-three/fiber";
import { OverlayTypes } from "@/types/enums";
import gsap from "gsap";
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

function fadeOutAndPause(audio: Audio, duration = 2) {
  gsap.to(audio.gain.gain, {
    value: 0,
    duration: duration,
    ease: "power1.inOut",
    onComplete: () => {
      audio.pause();
    },
  });
}

function fadeInAndPlay(audio: Audio, duration = 2) {
  audio.play();

  gsap.to(audio.gain.gain, {
    value: 0.5,
    duration: duration,
    ease: "power1.inOut",
  });
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
  const start = useStart((state) => state.start);

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
