import { Audio } from "three";
import gsap from "gsap";

export function fadeIn(audio: Audio, duration = 2, volume = 0.5) {
  audio.play();

  gsap.to(audio.gain.gain, {
    value: volume,
    duration: duration,
    ease: "power1.inOut",
  });
}

export function fadeOut(audio: Audio, duration = 2) {
  gsap.to(audio.gain.gain, {
    value: 0,
    duration: duration,
    ease: "power1.inOut",
  });
}

export function fadeOutAndPause(audio: Audio, duration = 2) {
  gsap.to(audio.gain.gain, {
    value: 0,
    duration: duration,
    ease: "power1.inOut",
    onComplete: () => {
      audio.pause();
    },
  });
}

export function fadeInAndPlay(audio: Audio, duration = 2) {
  audio.play();

  gsap.to(audio.gain.gain, {
    value: 0.5,
    duration: duration,
    ease: "power1.inOut",
  });
}
