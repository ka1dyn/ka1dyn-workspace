import FullscreenIcon from "@/icons/fullscreen.svg?react";
import FullscreenExitIcon from "@/icons/fullscreen_exit.svg?react";
import GithubIcon from "@/icons/github.svg?react";
import AudioVisualizer from "./AudioVisualizer";
import { useFullscreen, useTweaks } from "@/stores";
import { useShallow } from "zustand/shallow";

interface LeftNavProps {
  fullActive?: boolean;
  githubActive?: boolean;
  soundActive?: boolean;
}

export default function LeftNav({
  fullActive = true,
  githubActive = true,
  soundActive = true,
}: LeftNavProps) {
  const fullscreen = useFullscreen((state) => state.fullscreen);
  const { audioActive, setAudioActive } = useTweaks(
    useShallow((state) => ({
      audioActive: state.audioActive,
      setAudioActive: state.setAudioActive,
    })),
  );

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
    <div className="absolute h-[32px] left-8 top-10 flex items-center gap-6 pointer-events-auto [&>*]:w-8">
      {/* Full screen btn */}
      {fullActive && (
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
      )}

      {/* Github btn */}
      {githubActive && (
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
      )}

      {/* Audio btn */}
      {soundActive && (
        <div
          className="h-full relative cursor-pointer pointer-events-auto group"
          onClick={() => setAudioActive(!audioActive)}
        >
          <AudioVisualizer className="absolute w-[24px] h-[16px] bottom-[4px] left-1/2 -translate-x-1/2 cursor-pointer pointer-events-auto" />
        </div>
      )}
    </div>
  );
}
