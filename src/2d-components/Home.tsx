import { useTweaks } from "@/stores";
import type React from "react";

export default function Home() {
  const setDive = useTweaks((state) => state.setDive);

  return (
    <div className="home w-full h-full bg-amber-100 relative">
      home
      <button
        type="button"
        className="absolute right-10 bottom-20 cursor-pointer"
        onClick={() => setDive(false)}
      >
        Exit
      </button>
    </div>
  );
}
