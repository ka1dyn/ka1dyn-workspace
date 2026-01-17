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
    <div className="home w-full h-full bg-amber-100 relative">
      home
      <button
        type="button"
        className="absolute right-10 bottom-20 cursor-pointer"
        onClick={exitClick}
      >
        Exit
      </button>
    </div>
  );
}
