import { useOverlay, useTweaks } from "@/stores";
import { useShallow } from "zustand/shallow";

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
        className="w-full h-full object-cover object-[50%] opacity-40"
      />
      <div className="w-full h-10 bg-gray-200"></div>
      <div className="flex flex-col gap-10 w-24 min-h-50 absolute right-15 top-20">
        <div className="flex flex-col items-center gap-2">
          <div className="w-full h-24 bg-amber-500 text-center"></div>
          <div className="w-full break-all text-center text-[16px]/[1]">
            about me
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-full h-24 bg-amber-500 text-center"></div>
          <div className="w-full break-all text-center text-[16px]/[1]">
            projects
          </div>
        </div>
      </div>
    </div>
  );
}
