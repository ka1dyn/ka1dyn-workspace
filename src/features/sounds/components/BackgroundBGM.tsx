import { OverlayTypes, useOverlay, useSoundVol, useStart, useAudio } from "@/shared/stores";
import { useEffect } from "react";
import { fadeInAndPlay, fadeOutAndPause } from "../utils/soundEffect";
import { useShallow } from "zustand/shallow";
import { useSound } from "../hooks/useSound";

export function BackgroundBGM() {
  const { music, rain } = useSoundVol(
    useShallow((state) => ({
      ...state,
    })),
  );

  const { soundRef: rainSound, isReady: rainReady } = useSound(
    "audio/rain.mp3",
    true,
  );
  const { soundRef: bgSound, isReady: bgReady } = useSound(
    "audio/background.mp3",
    true,
  );

  const type = useOverlay((state) => state.type);

  const audioActive = useAudio((state) => state.audioActive);
  const start = useStart((state) => state.start);

  // // Volume changes
  useEffect(() => {
    if (!rainReady || !bgReady) return;

    bgSound.current.gain.gain.value = music;
    rainSound.current.gain.gain.value = rain;
  }, [rainReady, bgReady, music, rain]);

  useEffect(() => {
    if (!rainReady || !bgReady || !start) return;
    if (audioActive) {
      fadeInAndPlay(rainSound.current, 1, rain);

      if (type == OverlayTypes.DEFAULT) {
        fadeInAndPlay(bgSound.current, 1, music);
      }
    } else {
      fadeOutAndPause(bgSound.current, 1);
      fadeOutAndPause(rainSound.current, 1);
    }
  }, [audioActive]);

  useEffect(() => {
    if (!rainReady || !start) return;

    rainSound.current.play();
  }, [rainSound, start]);

  useEffect(() => {
    if (!bgReady || !start) return;

    if (type == OverlayTypes.DEFAULT && audioActive) {
      fadeInAndPlay(bgSound.current, 1, music);
    } else if (type == OverlayTypes.SCREEN) {
      fadeOutAndPause(bgSound.current);
    }
  }, [type, bgSound]);

  return null;
}
