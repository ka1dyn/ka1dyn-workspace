import { useOverlay, useTweaks } from "@/stores";
import { useShallow } from "zustand/shallow";
import Dock from "./Dock";

export default function Home() {
  const { audioPrev, setDive, setAudioActive } = useTweaks(
    useShallow((state) => ({
      ...state,
    })),
  );

  const setActive = useOverlay((state) => state.setActive);

  const exitClick = () => {
    setActive(true);
    setDive(false);
    setAudioActive(audioPrev);
  };

  return (
    // <div className="w-full h-full relative bg-[url(/images/man_rain_crop.jpg)] bg-position-[50%_80%] bg-no-repeat bg-cover opacity-50">
    <div className="w-full h-full relative overflow-hidden bg-black">
      <img
        src="/images/happy_dog.jpg"
        className="absolute w-full h-full object-cover object-[50%] opacity-60"
      />
      <div
        className="flex pl-4 items-center w-full h-16 relative overflow-hidden
                bg-gray-500/50 backdrop-blur-xl
                border-b border-black/20
                shadow-md"
      >
        <img src="/images/ka1dyn_logo.png" className="h-full" />
      </div>
      <div className="flex flex-col w-40 gap-10 absolute right-5 top-25 scale-[clamp(0.6,calc(100cqw/1920px),1.2)] origin-top-right">
        <div className={`flex flex-col items-center gap-2`}>
          <div className="flex flex-col gap-2 items-center">
            <img src="/images/folder.png" className="w-20 h-auto"></img>
            <div className="w-full break-all text-center lg:text-[18px] leading-none text-white">
              about_me
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-col gap-2 items-center">
            <img src="/images/folder.png" className="w-20 h-auto"></img>
            <div className="w-full break-all text-center lg:text-[18px] leading-none text-white">
              projects
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 scale-[clamp(0.7,calc(100cqh/1080px),1.6)] origin-bottom">
        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/4 w-10 h-20 bg-gray-300/50 backdrop-blur-2xl rounded-t-full"></div>
        <Dock />
      </div>
      <div className="@container-[size]">
        <div className="80cqh">
          <div className="w-5"></div>
          <div className="w-10"></div>
        </div>
      </div>
    </div>
  );
}
