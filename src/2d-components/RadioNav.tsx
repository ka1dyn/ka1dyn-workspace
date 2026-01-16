import AnimButton from "./AnimButton";
import { RadioBtnTypes } from "@/types/enums";
import { useState } from "react";
import PaletteIcon from "@/icons/palette.svg?react";
import PopupMenu from "./PopupMenu";

export default function RadioNav() {
  const [navClicked, setNavClicked] = useState<RadioBtnTypes>(
    RadioBtnTypes.NONE,
  );

  const btnClick = (type: RadioBtnTypes): void => {
    switch (type) {
      case RadioBtnTypes.SETTING:
        if (navClicked === RadioBtnTypes.SETTING) {
          setNavClicked(RadioBtnTypes.NONE);
          break;
        }
        setNavClicked(RadioBtnTypes.SETTING);
        break;
    }
  };

  return (
    <div className="absolute right-10 top-9 flex flex-col items-center gap-5">
      <AnimButton
        clicked={navClicked === RadioBtnTypes.SETTING}
        onClick={() => btnClick(RadioBtnTypes.SETTING)}
      >
        <PaletteIcon
          className={`w-8 h-8 transition-all duration-300 ease-out text-[#a3a3a3] group-hover:text-white 
            ${navClicked === RadioBtnTypes.SETTING && "text-white"}`}
        />
        {navClicked === RadioBtnTypes.SETTING && <PopupMenu />}
      </AnimButton>
    </div>
  );
}
