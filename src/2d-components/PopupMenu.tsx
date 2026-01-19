import usePopup from "@/hooks/usePopup";
import { useSoundVol, useTweaks } from "@/stores";
import { useShallow } from "zustand/shallow";
import { Slider } from "@/components/ui/slider";
import { SketchPicker } from "react-color";
import VolumeupIcon from "@/icons/volumeup.svg?react";
import VolumeoffIcon from "@/icons/volumeoff.svg?react";
import RefreshIcon from "@/icons/refresh.svg?react";

const tweak =
  "flex font-roboto font-bold items-center text-[12px] text-[#a3a3a3] gap-5";
const tweak_name = "w-20 text-left";

export default function PopupMenu() {
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
  const { music, rain, setMusic, setRain } = useSoundVol(
    useShallow((state) => ({
      ...state,
    })),
  );

  const { audioActive, setAudioActive } = useTweaks(
    useShallow((state) => ({
      ...state,
    })),
  );

  const soundRefreshClick = () => {
    setMusic(0.5);
    setRain(0.5);
  };

  const lightRefreshClick = () => {
    setLightColor("#c8b087");
    setIntensity(3);
  };

  return (
    <div
      className="absolute bg-[#0000002d] bottom-0 left-0 translate-y-[calc(100%+20px)] cursor-default flex flex-col justify-center gap-6 pt-5 px-6 pb-7"
      onClick={(e) => e.stopPropagation()}
    >
      <div>
        <div className="flex items-center mb-4 gap-5">
          <p className="font-roboto text-white text-[12px] w-20 text-left -translate-y-px pl-px">
            Light
          </p>
          <div className="flex gap-2">
            <div
              className="h-full cursor-pointer pointer-events-auto group/refresh"
              onClick={lightRefreshClick}
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
            <span className={tweak_name}>color</span>
            <div
              className="flex w-4.5 h-4.5 justify-center items-center cursor-pointer"
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
                      presetColors={[
                        "#c8b087",
                        "#FFFFFF",
                        "#D0021B",
                        "#F5A623",
                        "#F8E71C",
                        "#8B572A",
                        "#7ED321",
                        "#417505",
                        "#BD10E0",
                        "#9013FE",
                        "#4A90E2",
                        "#50E3C2",
                        "#B8E986",
                      ]}
                      onChange={(color) => setLightColor(color.hex)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className={tweak}>
            <span className={tweak_name}>intensity</span>
            <Slider
              defaultValue={[intensity]}
              value={[intensity]}
              min={0}
              max={6}
              step={0.1}
              onValueChange={(value) => setIntensity(value[0])}
              className="w-30"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center mb-4 gap-5">
          <p className="font-roboto text-white text-[12px] w-20 text-left -translate-y-px">
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
