import usePopup from "@/hooks/Popup";
import { useTweaks } from "@/stores";
import { useShallow } from "zustand/shallow";
import { Slider } from "@/components/ui/slider";
import { SketchPicker } from "react-color";

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
  return (
    <div
      className="absolute bg-[#0000002d] -top-0.5 left-0 -translate-x-[calc(100%+20px)] cursor-default flex flex-col justify-center gap-4 pt-5 px-6 pb-7"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="font-roboto text-white text-[16px] w-fit mb-4">Light</p>
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
  );
}
