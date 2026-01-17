import usePopup from "@/hooks/usePopup";
import { useSoundVol, useTweaks } from "@/stores";
import { useShallow } from "zustand/shallow";
import { Slider } from "@/components/ui/slider";
import { SketchPicker } from "react-color";

const menu_title = "font-roboto text-white text-[12px] w-fit mb-4";
const tweak = "flex font-roboto items-center text-[14px] text-[#a3a3a3] gap-5";
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
  const { music, rain, lightning, setMusic, setRain, setLightning } =
    useSoundVol(
      useShallow((state) => ({
        ...state,
      })),
    );

  return (
    <div
      className="absolute bg-[#0000002d] bottom-0 left-0 translate-y-[calc(100%+20px)] cursor-default flex flex-col justify-center gap-4 pt-5 px-6 pb-7"
      onClick={(e) => e.stopPropagation()}
    >
      <div>
        <p className={menu_title}>Light</p>
        <div className="flex flex-col gap-2">
          <div className={tweak}>
            <span className={tweak_name}>color</span>
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
          <div className={tweak}>
            <span className={tweak_name}>intensity</span>
            <Slider
              defaultValue={[intensity]}
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
        <p className={menu_title}>Sound</p>

        <div className="flex flex-col gap-2">
          <div className={tweak}>
            <span className={tweak_name}>music</span>
            <Slider
              defaultValue={[music]}
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
              min={0}
              max={1}
              step={0.01}
              onValueChange={(value) => setRain(value[0])}
              className="w-30"
            />
          </div>
          <div className={tweak}>
            <span className={tweak_name}>lightning</span>
            <Slider
              defaultValue={[lightning]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(value) => setLightning(value[0])}
              className="w-30"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
