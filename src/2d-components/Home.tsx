import { useOverlay, useTweaks } from "@/stores";
import { useShallow } from "zustand/shallow";
import ArrowDown from "@/icons/arrow_down.svg?react";
import Dock from "./Dock";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import InfoModal from "./InfoModal";

export default function Home() {
  const { audioPrev, setDive, setAudioActive } = useTweaks(
    useShallow((state) => ({
      ...state,
    })),
  );
  const [imgSrc, setImgSrc] = useState<string>("/images/happy_dog.webp");
  const [dockActive, setDockActive] = useState<boolean>(true);
  const setActive = useOverlay((state) => state.setActive);

  const exitClick = () => {
    setActive(true);
    setDive(false);
    setAudioActive(audioPrev);
  };

  return (
    // <div className="w-full h-full relative bg-[url(/images/man_rain_crop.jpg)] bg-position-[50%_80%] bg-no-repeat bg-cover opacity-50">
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-black select-none">
      <img
        src={imgSrc}
        className="happy absolute w-full h-full object-cover object-[50%_50%] opacity-60 pointer-events-none"
      />
      <div
        className="flex pl-4 items-center w-full h-16 relative overflow-hidden
                bg-gray-500/50 backdrop-blur-sm
                border-b border-black/20
                shadow-md"
      >
        <img src="/images/ka1dyn_logo.png" className="h-full" />
      </div>
      <InfoModal />
      <div className="flex flex-col w-40 gap-5 absolute right-5 top-25 scale-[clamp(0.6,calc(100cqw/1920px),1.4)] origin-top-right">
        <button className={`flex flex-col items-center group cursor-pointer`}>
          <div className="flex flex-col gap-1 items-center">
            <div
              className="flex justify-center items-center w-25 h-23 border-gray-400/70
            group-focus:bg-black/20 group-focus:border-2"
            >
              <img
                src="/images/folder.png"
                className="w-20 h-auto pointer-events-none"
              ></img>
            </div>

            {/* Div for background wrap */}
            <div>
              <span className="break-all text-center lg:text-[18px] leading-none text-white group-focus:bg-blue-600">
                about_me
              </span>
            </div>
          </div>
        </button>

        <button className={`flex flex-col items-center group cursor-pointer`}>
          <div className="flex flex-col gap-1 items-center">
            <div
              className="flex justify-center items-center w-25 h-25 border-gray-400/70
            group-focus:bg-black/20 group-focus:border-2"
            >
              <img
                src="/images/folder.png"
                className="w-20 h-auto pointer-events-none"
              ></img>
            </div>

            {/* Div for background wrap */}
            <div>
              <span className="break-all text-center lg:text-[18px] leading-none text-white group-focus:bg-blue-600">
                projects
              </span>
            </div>
          </div>
        </button>
      </div>

      <div
        className={cn(
          "absolute bottom-0 left-1/2 -translate-x-1/2 scale-[clamp(0.7,calc(100cqh/1080px),1.6)] origin-bottom transition-all ease-out duration-300",
          !dockActive && "translate-y-[calc(100%*calc(100cqh/1080px)-15px)]",
        )}
      >
        <div
          className="flex flex-col items-center absolute left-1/2 -translate-x-1/2 -translate-y-1/4 w-10 h-20 bg-gray-500/50 backdrop-blur-sm rounded-t-full cursor-pointer"
          onClick={() => setDockActive(!dockActive)}
        >
          <ArrowDown
            className={cn(
              "w-7 h-7 text-white -translate-y-0.5 transition-all duration-300 ease-out",
              !dockActive && "rotate-180",
            )}
          />
        </div>
        <Dock setImgSrc={(path: string) => setImgSrc(path)} />
      </div>
    </div>
  );
}
