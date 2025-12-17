import { useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Audio, AudioListener, AudioLoader } from "three";

export function useSound(audioPath: string) {
  const { camera } = useThree();
  const [loaded, setLoaded] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const soundRef = useRef<Audio>(null!);

  useEffect(() => {
    const listener = new AudioListener();
    camera.add(listener)

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
  }, []);

  useEffect(() => {
    if(!loaded) return

    const handleClick = () => {
        setIsReady(true);
    }
    
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