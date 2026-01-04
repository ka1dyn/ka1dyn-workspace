import { useOverlay } from "@/stores"
import { Overlay as OverlayTypes } from "@/types/enums"
import { useShallow } from "zustand/shallow"

export default function Overlay() {
    const {active, type, setType} = useOverlay(useShallow(state => ({
        active: state.active,
        type: state.type,
        setType: state.setType
    })))

    const screenClick = () => {
        setType(OverlayTypes.SCREEN)
    }

    const backClick = () => {
        setType(OverlayTypes.DEFAULT)
    }

    const DefaultOverlay = () => (
        <div className="panel w-2xl absolute bottom-10 left-10 bg-black/30 px-5 py-2">
            <button className="text-white pointer-events-auto hover:cursor-pointer" onClick={screenClick}>{"screen >"}</button>
        </div>
    )

    const ScreenOverlay = () => (
        <div className="panel w-2xl absolute bottom-10 left-10 bg-black/30 px-5 py-2">
            <button className="text-white pointer-events-auto hover:cursor-pointer" onClick={backClick}>{"back >"}</button>
        </div>
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
