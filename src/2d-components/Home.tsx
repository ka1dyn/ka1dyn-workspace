import {
  useBgImageStore,
  useModalStore,
  useOverlay,
  useTweaks,
} from "@/stores";
import { useShallow } from "zustand/shallow";
import ArrowDown from "@/icons/arrow_down.svg?react";
import Dock from "./Dock";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Folder from "./Folder";
import ModalContainer from "./ModalContainer";

export default function Home() {
  const { audioPrev, setDive, setAudioActive } = useTweaks(
    useShallow((state) => ({
      ...state,
    })),
  );
  const path = useBgImageStore((state) => state.path);
  const [dockActive, setDockActive] = useState<boolean>(true);
  const setActive = useOverlay((state) => state.setActive);
  const dive = useTweaks((state) => state.dive);

  const exitClick = async () => {
    setActive(true);

    await useModalStore.getState().backupAll();

    setDive(false);
    setAudioActive(audioPrev);
  };

  return (
    // <div className="w-full h-full relative bg-[url(/images/man_rain_crop.jpg)] bg-position-[50%_80%] bg-no-repeat bg-cover opacity-50">
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-black select-none">
      <img
        src={path}
        className="absolute w-full h-full object-cover object-[50%_50%] opacity-60 pointer-events-none"
      />
      <div
        className="flex pl-4 items-center w-full h-16 relative overflow-hidden
                bg-gray-500/50 backdrop-blur-sm
                border-b border-black/20
                shadow-md"
      >
        <img src="/images/ka1dyn_logo.png" className="h-full" />
      </div>

      <div className="flex flex-col w-40 gap-5 absolute right-5 top-25 scale-[clamp(0.6,calc(100cqh/1080px),1.5)] origin-top-right z-5">
        <Folder
          id="folder-about_me"
          name="about_me"
          initModalX={160}
          initModalY={120}
        />
        <Folder
          id="folder-projects"
          name="projects"
          initModalX={200}
          initModalY={150}
        />
      </div>

      <ModalContainer className="absolute top-0 left-0 w-full h-full z-10" />

      <div
        className={cn(
          "absolute bottom-0 left-1/2 -translate-x-1/2 scale-[clamp(0.7,calc(100cqh/1080px),1.6)] origin-bottom transition-all ease-out duration-300 z-15",
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
        <Dock className="z-10" />
      </div>
      {dive && (
        <div
          className="pointer-events-auto absolute left-14 bottom-12 text-[28px] text-[#c9c9c9] cursor-pointer hover:text-white z-15 font-roboto"
          onClick={exitClick}
        >
          exit
        </div>
      )}
    </div>
  );
}
