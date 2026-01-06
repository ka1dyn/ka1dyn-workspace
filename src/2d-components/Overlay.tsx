import { useOverlay } from "@/stores"
import { Overlay as OverlayTypes } from "@/types/enums"
import { useShallow } from "zustand/shallow"
import Palette from "@/icons/palette.svg?react"

export default function Overlay() {
    const {active, type, setType, setActive} = useOverlay(useShallow(state => ({
        active: state.active,
        type: state.type,
        setType: state.setType,
        setActive: state.setActive
    })))

    const screenClick = () => {
        setActive(false);
        setType(OverlayTypes.SCREEN)
    }

    const backClick = () => {
        setActive(false);
        setType(OverlayTypes.DEFAULT)
    }

    const DefaultOverlay = () => (
        <div>
            {/* Screen btn */}
            <button className={`
                w-34 h-11 px-5 py-2.5 bg-transparent text-[#c9c9c9] text-[18px]/[18px] font-medium font-roboto 
                border-t border-b border-[#ffffff2c]
                absolute left-1/2 -translate-x-1/2 bottom-18
                
                cursor-pointer pointer-events-auto
                animate-slide-up
                transition-all duration-300 ease-in-out
                
                hover:text-white

                before:content-[''] before:absolute before:top-0 before:right-0 before:h-px before:w-0 before:bg-white
                before:transition-all before:duration-400 before:ease-in-out
                hover:before:w-full hover:before:duration-800

                after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-white
                after:transition-all after:duration-400 after:ease-in-out
                hover:after:w-full hover:after:duration-800
            `}    
            onClick={screenClick}>{"screen >"}</button>

            {/* Graphic btn */}
            <button className="
                w-14 h-14 bg-transparent
                text-[#c9c9c9] text-[18px]/[18px] font-medium font-roboto
                flex justify-center items-center
                border border-[#ffffff2c]
                absolute left-8 top-8

                cursor-pointer pointer-events-auto

                group
            ">
                <span className="absolute w-0 h-px left-0 top-0 bg-[#ffffff50] transition-all duration-300 ease-out group-hover:w-full group-hover:bg-white"></span>
                <span className="absolute w-px h-0 right-0 top-0 bg-[#ffffff50] transition-all duration-300 ease-out group-hover:h-full group-hover:bg-white"></span>
                <span className="absolute w-0 h-px right-0 bottom-0 bg-[#ffffff50] transition-all duration-300 ease-out group-hover:w-full group-hover:bg-white"></span>
                <span className="absolute w-px h-0 left-0 bottom-0 bg-[#ffffff50] transition-all duration-300 ease-out group-hover:h-full group-hover:bg-white"></span>
                <Palette className="w-8 h-8 transition-all duration-300 ease-out text-[#c9c9c9] group-hover:text-white"/>
            </button>
        </div>
    )

    const ScreenOverlay = () => (
        <button className="
            animate-slide-up
            absolute left-35 bottom-32 pointer-events-auto
            text-[#c9c9c9] text-[20px] font-medium font-roboto  
            hover:cursor-pointer hover:text-white
        " onClick={backClick}>{"< back"}</button>
    )

    const RenderOverlay = () => {
        switch(type) {
            case OverlayTypes.DEFAULT:
                return <DefaultOverlay />
            case OverlayTypes.SCREEN:
                return <ScreenOverlay />
            default:
                return null;
  }
    }

    return <div className="absolute w-full h-screen pointer-events-none z-10000000">   
        {active && <RenderOverlay />}
    </div>
}
