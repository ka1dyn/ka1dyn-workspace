import { useOverlay } from "@/stores";
import { NavTypes, OverlayTypes } from "@/types/enums";
import { useShallow } from "zustand/shallow";
import Palette from "@/icons/palette.svg?react";
import NavButton from "./NavButton";
import { useState } from "react";

export default function Overlay() {
  const [navOpen, setNavOpen] = useState<boolean>(false);
  const { active, type, setType, setActive } = useOverlay(
    useShallow((state) => ({
      active: state.active,
      type: state.type,
      setType: state.setType,
      setActive: state.setActive,
    })),
  );

  const navClick = (type: NavTypes) => {
    switch (type) {
      case NavTypes.FULL:
        setNavOpen(!navOpen);
        return;
      case NavTypes.GRAPHIC:
        return;
      case NavTypes.AUDIO:
        return;
    }
  };

  const screenClick = () => {
    setActive(false);
    setType(OverlayTypes.SCREEN);
  };

  const backClick = () => {
    setActive(false);
    setType(OverlayTypes.DEFAULT);
  };

  const DefaultOverlay = () => (
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
        <NavButton onClick={() => navClick(NavTypes.FULL)}>
          <Palette className="w-8 h-8 transition-all duration-300 ease-out text-[#c9c9c9] group-hover:text-white" />
        </NavButton>

        {/* Graphic btn */}
        <NavButton onClick={() => navClick(NavTypes.GRAPHIC)}>
          <Palette className="w-8 h-8 transition-all duration-300 ease-out text-[#c9c9c9] group-hover:text-white" />
        </NavButton>

        {/* Audio btn */}
        <NavButton onClick={() => navClick(NavTypes.AUDIO)}>
          <Palette className="w-8 h-8 transition-all duration-300 ease-out text-[#c9c9c9] group-hover:text-white" />
        </NavButton>

        {navOpen && (
          <div className="absolute w-80 h-14 bg-[#deae28b3] top-20 left-0"></div>
        )}
      </div>
    </div>
  );

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

  const RenderOverlay = () => {
    switch (type) {
      case OverlayTypes.DEFAULT:
        return <DefaultOverlay />;
      case OverlayTypes.SCREEN:
        return <ScreenOverlay />;
      default:
        return null;
    }
  };

  return (
    <div className="absolute w-full h-screen pointer-events-none z-10000000">
      {active && <RenderOverlay />}
    </div>
  );
}
