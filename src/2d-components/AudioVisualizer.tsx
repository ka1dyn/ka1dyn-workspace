import { useTweaks } from "@/stores";
import { useEffect, useRef } from "react";
import { useShallow } from "zustand/shallow";

export default function AudioVisualizer({ className }: { className?: string }) {
  const stickRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animationRefs = useRef<Animation[]>([]);
  const audioActive = useTweaks((state) => state.audioActive);

  const stickCnt = 4;

  useEffect(() => {
    if (
      stickRefs.current.length != stickCnt ||
      stickRefs.current.some((el) => !el)
    )
      return;

    const max = 4;
    const duration = 1200;
    const delayFactor = Math.floor(duration / stickCnt);

    if (audioActive) {
      animationRefs.current = [...Array(stickCnt)];
      stickRefs.current.forEach((stick, i) => {
        const animation = stick?.animate(
          [
            { transform: `scaleY(${1})` },
            { transform: `scaleY(${max})` },
            { transform: `scaleY(${1})` },
          ],
          {
            duration,
            iterations: Infinity,
            easing: "ease-in-out",
            direction: "normal",
            delay: delayFactor * i,
          },
        );

        animationRefs.current[i] = animation as Animation;
      });
    } else {
      animationRefs.current.forEach((anim, i) => {
        anim.commitStyles();
        anim.cancel();

        const stick = stickRefs.current[i] as HTMLDivElement;
        void stick.offsetWidth;

        requestAnimationFrame(() => {
          stick.style.transform = "scaleY(1)";
        });
      });
    }
  }, [audioActive]);

  return (
    <div
      className={`flex justify-around items-end w-8 h-8 pointer-events-auto group ${className}`}
    >
      {[...Array(stickCnt)].map((_, i) => (
        <div
          key={i}
          ref={(node) => {
            stickRefs.current[i] = node;
          }}
          className="w-[1.5px] h-1/4 origin-bottom transition-all duration-800 ease-out bg-[#a3a3a3] group-hover:bg-white"
        />
      ))}
    </div>
  );
}
