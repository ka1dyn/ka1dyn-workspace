import { useAudio, useSoundVol } from "@/shared/stores";
import { useShallow } from "zustand/shallow";
import { Slider } from "@/shared/components/ui/slider";
import VolumeupIcon from "../icons/volumeup.svg?react";
import VolumeoffIcon from "../icons/volumeoff.svg?react";
import RefreshIcon from "../icons/refresh.svg?react";

const tweak = "flex font-bold items-center text-[12px] text-[#a3a3a3] gap-5";
const tweak_name = "w-20 text-left";

export default function PopupMenu() {
  const { music, rain, setMusic, setRain } = useSoundVol(
    useShallow((state) => ({
      ...state,
    })),
  );

  const { audioActive, setAudioActive } = useAudio(
    useShallow((state) => ({
      ...state,
    })),
  );

  const soundRefreshClick = () => {
    setMusic(0.5);
    setRain(0.5);
  };

  return (
    <div
      className="absolute bg-[#0000002d] bottom-0 left-0 translate-y-[calc(100%+20px)] cursor-default flex flex-col justify-center gap-6 pt-5 px-6 pb-7"
      onClick={(e) => e.stopPropagation()}
    >
      <div>
        <div className="flex items-center mb-4 gap-5">
          <p className="text-white text-[12px] w-20 text-left -translate-y-px">
            Sound
          </p>
          <div className="flex gap-2">
            <div
              className="h-full cursor-pointer pointer-events-auto group/volumeup"
              onClick={() => setAudioActive(!audioActive)}
            >
              {audioActive ? (
                <VolumeupIcon
                  width="18px"
                  height="18px"
                  className="text-[#a3a3a3] group-hover/volumeup:text-white"
                />
              ) : (
                <VolumeoffIcon
                  width="18px"
                  height="18px"
                  className="text-[#a3a3a3] group-hover/volumeup:text-white"
                />
              )}
            </div>
            <div
              className="h-full cursor-pointer pointer-events-auto group/refresh"
              onClick={soundRefreshClick}
            >
              <RefreshIcon
                width="18px"
                height="18px"
                className="text-[#a3a3a3] group-hover/refresh:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className={tweak}>
            <span className={tweak_name}>music</span>
            <Slider
              defaultValue={[music]}
              value={[music]}
              disabled={!audioActive}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(value) => setMusic(value[0])}
              className="w-30"
            />
          </div>
          <div className={tweak}>
            <span className={tweak_name}>rain</span>
            <Slider
              defaultValue={[rain]}
              value={[rain]}
              disabled={!audioActive}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(value) => setRain(value[0])}
              className="w-30"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
