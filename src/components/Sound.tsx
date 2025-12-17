import { useThree } from "@react-three/fiber";
import { createContext, useContext, useEffect, useRef, useState, type RefObject } from "react";
import { Audio, AudioListener, AudioLoader } from "three";

export const AudioContext = createContext<RefObject<AudioListener> | null>(null);

export function AudioProvider({children}: {children: React.ReactNode}) {
  const { camera } = useThree();
  const listenerRef = useRef<AudioListener>(null!);

  useEffect(() => {
    const listener = new AudioListener();
    listenerRef.current = listener

    camera.add(listener)
  }, [camera])
  
  return (
    <AudioContext.Provider value={listenerRef}>
      {children}
    </AudioContext.Provider>
  )
}

export function useSound(audioPath: string) {
  
  const [loaded, setLoaded] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const audioListener = useContext(AudioContext)
  const soundRef = useRef<Audio>(null!);

  useEffect(() => {
    if (!audioListener) return;

    const listener = audioListener.current

    const sound = new Audio(listener);
    soundRef.current = sound

    const audioLoader = new AudioLoader();
    audioLoader.load(audioPath, (buffer) => {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.5);

        setLoaded(true);
    })

    return () => {
      sound.stop()
    }
  }, [audioListener]);

  useEffect(() => {
    if(!loaded) return

    const handleClick = () => {
        setIsReady(true);
    }
    
    // For browser policy
    window.addEventListener('click', handleClick, {once: true});

    return () => {
        window.removeEventListener('click', handleClick)
    }
  }, [loaded])

  return {soundRef, isReady};
}

export function BackgroundBGM() {
    const {soundRef, isReady} = useSound('audio/rain.mp3')

    useEffect(() => {
        if (!isReady) return

        soundRef.current.play()
    }, [isReady])

    return null
}