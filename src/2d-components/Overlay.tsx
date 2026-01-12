import { useFullscreen, useOverlay } from "@/stores";
import { NavTypes, OverlayTypes } from "@/types/enums";
import { useShallow } from "zustand/shallow";
import PaletteIcon from "@/icons/palette.svg?react";
import FullscreenIcon from "@/icons/fullscreen.svg?react";
import FullscreenExitIcon from "@/icons/fullscreen_exit.svg?react";
import NavButton from "./NavButton";
import { useEffect, useMemo, useState } from "react";

interface DefaultOverlayProps {
  screenClick: () => void;
}

function DefaultOverlay({ screenClick }: DefaultOverlayProps) {
  const [navClicked, setNavClicked] = useState<NavTypes>(NavTypes.NONE);
  const fullscreen = useFullscreen((state) => state.fullscreen);

  const navClick = (type: NavTypes): void => {
    switch (type) {
      case NavTypes.FULL:
        if (navClicked === NavTypes.FULL) {
          setNavClicked(NavTypes.NONE);
          break;
        }
        setNavClicked(NavTypes.FULL);
        break;
      case NavTypes.GRAPHIC:
        if (navClicked === NavTypes.GRAPHIC) {
          setNavClicked(NavTypes.NONE);
          break;
        }
        setNavClicked(NavTypes.GRAPHIC);
        break;
      case NavTypes.AUDIO:
        if (navClicked === NavTypes.AUDIO) {
          setNavClicked(NavTypes.NONE);
          break;
        }
        setNavClicked(NavTypes.AUDIO);
        break;
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      // 전체 화면 진입
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error: ${err.message}`);
      });
    } else {
      // 전체 화면 해제
      document.exitFullscreen();
    }
  };

  return (
    <div>
      {/* Screen btn */}
      <button
        className={`
                w-34 h-11 px-5 py-2.5 bg-transparent text-[#c9c9c9] text-[18px]/[18px] font-medium font-roboto 
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

      <div className="absolute left-8 top-9 flex items-center gap-5">
        {/* Full screen btn */}
        <NavButton clicked={false} onClick={toggleFullScreen}>
          {fullscreen ? (
            <FullscreenExitIcon
              className={`w-8 h-8 transition-all duration-300 ease-out text-[#a3a3a3] group-hover:text-white`}
            />
          ) : (
            <FullscreenIcon
              className={`w-8 h-8 transition-all duration-300 ease-out text-[#a3a3a3] group-hover:text-white`}
            />
          )}
        </NavButton>

        {/* Graphic btn */}
        <NavButton
          clicked={navClicked === NavTypes.GRAPHIC}
          onClick={() => navClick(NavTypes.GRAPHIC)}
        >
          <PaletteIcon
            className={`w-8 h-8 transition-all duration-300 ease-out text-[#a3a3a3] group-hover:text-white 
            ${navClicked === NavTypes.GRAPHIC && "text-white"}`}
          />
          {navClicked === NavTypes.GRAPHIC && (
            <div
              className="absolute w-80 h-14 bg-[#deae28b3] top-20 left-0 cursor-default"
              onClick={(e) => e.stopPropagation()}
            ></div>
          )}
        </NavButton>

        {/* Audio btn */}
        <NavButton
          clicked={navClicked === NavTypes.AUDIO}
          onClick={() => navClick(NavTypes.AUDIO)}
        >
          <PaletteIcon
            className={`w-8 h-8 transition-all duration-300 ease-out text-[#a3a3a3] group-hover:text-white
            ${navClicked === NavTypes.AUDIO && "text-white"}`}
          />
          {navClicked === NavTypes.AUDIO && (
            <div
              className="absolute w-80 h-14 bg-[#deae28b3] top-20 left-0 cursor-default"
              onClick={(e) => e.stopPropagation()}
            ></div>
          )}
        </NavButton>
      </div>
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

  const screenClick = () => {
    setActive(false);
    setType(OverlayTypes.SCREEN);
  };

  const backClick = () => {
    setActive(false);
    setType(OverlayTypes.DEFAULT);
  };

  const ScreenOverlay = () => (
    <button
      className="
            animate-slide-up
            absolute left-35 bottom-32 pointer-events-auto
            text-[#c9c9c9] text-[20px] font-medium font-roboto  
            hover:cursor-pointer hover:text-white
        "
      onClick={backClick}
    >
      {"< back"}
    </button>
  );

  const RenderOverlay = useMemo(() => {
    switch (type) {
      case OverlayTypes.DEFAULT:
        return <DefaultOverlay screenClick={screenClick} />;
      case OverlayTypes.SCREEN:
        return <ScreenOverlay />;
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
