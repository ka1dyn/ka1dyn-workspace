import { useFullscreen, useOverlay, useTweaks } from "@/stores";
import { NavTypes, OverlayTypes } from "@/types/enums";
import { useShallow } from "zustand/shallow";
import PaletteIcon from "@/icons/palette.svg?react";
import FullscreenIcon from "@/icons/fullscreen.svg?react";
import FullscreenExitIcon from "@/icons/fullscreen_exit.svg?react";
import GithubIcon from "@/icons/github.svg?react";
import NavButton from "./NavButton";
import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { SketchPicker } from "react-color";
import usePopup from "@/hooks/Popup";
import AudioVisualizer from "./AudioVisualizer";

interface DefaultOverlayProps {
  screenClick: () => void;
}

function DefaultOverlay({ screenClick }: DefaultOverlayProps) {
  const [navClicked, setNavClicked] = useState<NavTypes>(NavTypes.NONE);
  const fullscreen = useFullscreen((state) => state.fullscreen);
  const {
    active: pickerActive,
    setActive: setPickerActive,
    containerRef: pickerRef,
  } = usePopup();
  const { intensity, lightColor, setIntensity, setLightColor } = useTweaks(
    useShallow((state) => ({
      intensity: state.intensity,
      lightColor: state.lightColor,
      setIntensity: state.setIntensity,
      setLightColor: state.setLightColor,
    })),
  );
  const { audioActive, setAudioActive } = useTweaks(
    useShallow((state) => ({
      audioActive: state.audioActive,
      setAudioActive: state.setAudioActive,
    })),
  );

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

      <div className="absolute right-10 top-9 flex items-center gap-5">
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
              className="absolute bg-[#0000002d] -top-0.5 left-0 -translate-x-[calc(100%+20px)] cursor-default flex flex-col justify-center gap-4 pt-5 px-6 pb-7"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-roboto text-white text-[16px] w-fit mb-4">
                Light
              </p>
              <div className="flex font-roboto font- items-center text-[16px] text-[#a3a3a3] gap-5">
                <span className="w-[80px] text-left">color</span>
                <div
                  className="flex justify-center items-center w-6 h-6 cursor-pointer"
                  onClick={() => setPickerActive(true)}
                >
                  <div
                    className={`size-4 rounded-full border-[1.5px] border-[#a3a3a3]`}
                    style={{ backgroundColor: lightColor }}
                  >
                    {pickerActive && (
                      <div ref={pickerRef} className="cursor-default">
                        <SketchPicker
                          className="absolute pointer-events-auto z-10000001"
                          disableAlpha={true}
                          color={lightColor}
                          onChange={(color) => setLightColor(color.hex)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex font-roboto items-center text-[16px] text-[#a3a3a3] gap-5">
                <span className="w-[80px] text-left">intensity</span>
                <Slider
                  defaultValue={[intensity]}
                  min={0}
                  max={6}
                  step={0.1}
                  onValueChange={(value) => setIntensity(value[0])}
                  className="w-[120px]"
                />
              </div>
            </div>
          )}
        </NavButton>
      </div>

      <div className="absolute h-[32px] left-8 top-10 flex items-center gap-6 pointer-events-auto [&>*]:w-8">
        {/* Full screen btn */}
        <div className="">
          <button
            className="
                flex justify-center items-center cursor-pointer pointer-events-auto"
            onClick={toggleFullScreen}
          >
            {fullscreen ? (
              <FullscreenExitIcon
                className={`w-8 h-8 transition-all duration-300 ease-out text-[#a3a3a3] hover:text-white`}
              />
            ) : (
              <FullscreenIcon
                className={`w-8 h-8 transition-all duration-300 ease-out text-[#a3a3a3] hover:text-white`}
              />
            )}
          </button>
        </div>

        {/* Github btn */}
        <div
          className="h-full overflow-hidden flex items-center justify-center cursor-pointer pointer-events-auto group"
          onClick={() =>
            window.open(
              "https://github.com/ka1dyn",
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          <GithubIcon
            className="w-[24px] h-[24px] text-[#a3a3a3] group-hover:text-white transition-all duration-300 ease-out"
            viewBox="0 0 98 96"
            preserveAspectRatio="xMidYMid meet"
          />
        </div>

        {/* Audio btn */}
        <div
          className="h-full relative cursor-pointer pointer-events-auto group"
          onClick={() => setAudioActive(!audioActive)}
        >
          <AudioVisualizer className="absolute w-[24px] h-[16px] bottom-[4px] left-1/2 -translate-x-1/2 cursor-pointer pointer-events-auto" />
        </div>
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
