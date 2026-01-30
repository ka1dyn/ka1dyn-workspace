import { useModalStore, useOverlay, useTweaks } from "@/stores";
import { OverlayTypes } from "@/types/enums";
import { useShallow } from "zustand/shallow";
import { useMemo } from "react";
import RightNav from "./RightNav";
import RadioNav from "./RadioNav";
import useCameraAnim from "@/hooks/useCameraAnim";

interface DefaultOverlayProps {
  screenClick: () => void;
}

interface ScreenOverlayProps {
  backClick: () => void;
}

function DefaultOverlay({ screenClick }: DefaultOverlayProps) {
  return (
    <div>
      {/* Left nav */}
      <RightNav />

      {/* Right nav */}
      <RadioNav />

      {/* Screen btn */}
      <button
        className={`
                w-34 h-11 px-5 py-2.5 bg-transparent text-[#c9c9c9] text-[18px]/[18px] font-medium font-roboto  select-none
                border-t border-b border-[#ffffff2c]
                absolute left-1/2 -translate-x-1/2 bottom-18
                
                cursor-pointer pointer-events-auto
                animate-slide-up
                transition-all duration-300 ease-in-out
                
                hover:text-white

                before:content-[''] before:absolute before:top-0 before:right-0 before:h-px before:w-0 before:bg-white
                before:transition-all before:duration-400 before:ease-in-out
                hover:before:w-full hover:before:duration-800

                after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-white
                after:transition-all after:duration-400 after:ease-in-out
                hover:after:w-full hover:after:duration-800
            `}
        onClick={screenClick}
      >
        {"screen >"}
      </button>
    </div>
  );
}

function ScreenOverlay({ backClick }: ScreenOverlayProps) {
  const { audioActive, setDive, setAudioActive, setAudioPrev } = useTweaks(
    useShallow((state) => ({
      ...state,
    })),
  );
  const setActive = useOverlay((state) => state.setActive);

  const diveClick = async () => {
    setActive(false);

    await useModalStore.getState().backupAll();

    setDive(true);
    setAudioPrev(audioActive);
    setAudioActive(false);
  };

  return (
    <div>
      {/* Left nav */}
      <RightNav />

      <button
        className="
            animate-slide-up
            absolute left-20 bottom-50 pointer-events-auto
            text-[#c9c9c9] text-[20px] font-medium font-roboto  
            hover:cursor-pointer hover:text-white
        "
        onClick={backClick}
      >
        {"back"}
      </button>

      <button
        className="animate-slide-up
          absolute left-20 bottom-68 pointer-events-auto
          text-[#c9c9c9] text-[20px] font-medium font-roboto
          hover:cursor-pointer hover:text-white
      "
        onClick={diveClick}
      >
        {"dive in"}
      </button>
    </div>
  );
}

export default function Overlay() {
  const { active, type, setType, setActive } = useOverlay(
    useShallow((state) => ({
      active: state.active,
      type: state.type,
      setType: state.setType,
      setActive: state.setActive,
    })),
  );
  const { screenAnimation, backAnimation } = useCameraAnim();

  const screenClick = () => {
    setActive(false);
    setType(OverlayTypes.SCREEN);
    screenAnimation();
  };

  const backClick = () => {
    setActive(false);
    setType(OverlayTypes.DEFAULT);
    backAnimation();
  };

  const RenderOverlay = useMemo(() => {
    switch (type) {
      case OverlayTypes.DEFAULT:
        return <DefaultOverlay screenClick={screenClick} />;
      case OverlayTypes.SCREEN:
        return <ScreenOverlay backClick={backClick} />;
      default:
        return null;
    }
  }, [type, screenClick]);

  return (
    <div className="absolute w-full h-screen pointer-events-none z-10000000">
      {active && RenderOverlay}
    </div>
  );
}
