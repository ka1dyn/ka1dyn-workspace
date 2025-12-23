import { useReady, useStart } from "@/stores"
import { useEffect, useState } from "react"

export default function Booting() {
    const start = useStart((state) => state.start)
    const [booting, setBooting] = useState<boolean>(false);
    const [fill, setFill] = useState<boolean>(false);
    const [done, setDone] = useState<boolean>(false);
    const setScreenReady = useReady((state) => state.setScreenReady)

    const bootingStart = () => {
        setBooting(true);
    }

    const fillStart = () => {
        setFill(true);
    }

    const fillEnd = () => {
        setDone(true);
    }

    const loadHome = () => {
        setTimeout(() => setScreenReady(true), 1500)
    }

    useEffect(() => {
        if(!booting) return;

        setTimeout(fillStart, 500);
    }, [booting])


    useEffect(() => {
        if(!start) return;

        setTimeout(bootingStart, 1000)
    }, [start])

    return (
        <div className="w-full h-full bg-black flex justify-center items-center">
            {booting && 
                <div 
                    className={`text-white flex flex-col items-center transition-all transition-discrete ${done ? 'opacity-0' : 'block'}`}
                    onTransitionEnd={loadHome}
                >
                    <img className="w-96" src="images/ka1dyn_logo.png" />
                    <div className="w-100 h-1 rounded-2xl bg-[#434343] mt-2 overflow-hidden">
                        <div 
                            className={`h-full bg-white transition-all duration-2000 ease-linear ${fill ? 'w-full' : 'w-0'}`}
                            onTransitionEnd={fillEnd}
                        />
                    </div>
            </div>}
        </div>
    )
}