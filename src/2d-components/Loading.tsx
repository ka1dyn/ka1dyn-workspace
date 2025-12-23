import { useEffect, useRef, useState } from "react";
import { TextScramble } from "../animations/textScramble";
import { useReady, useStart } from "../stores";

export default function Loading() {

    const textRef = useRef<HTMLDivElement>(null!);
    const [ready, setReady] = useState<boolean>(false);
    const setStart = useStart((state) => state.setStart)
    const frameReady = useReady((state) => state.frameReady)

    const btnClick = () => {
        setStart(true)
    }
    
    useEffect(() => {
        if (!textRef.current) return;

        // Intro loading animation
        const phrases = [
            'Hello,',
            "welcome to Kaidyn's devlog",
            'please click below to start',
        ];

        const fx = new TextScramble(textRef.current);

        const next = (idx: number) => {
        if (idx >= phrases.length) {
            setReady(true);
            return;
        }

        fx.setText(phrases[idx]).then(() => {
            setTimeout(() => {
            next(idx + 1);
            }, 800);
        });
        };

        next(0);
    }, []);
    
    return(
        <div className="w-screen h-screen absolute top-0 bg-[#212121] flex justify-center items-center z-1000000000">
            <div className="w-1/2 flex flex-col items-center">
                <div className="text-[#fafafa] text-3xl font-thin" ref={textRef}></div>
                {ready && (
                    frameReady ? <button onClick={btnClick}>click</button>    
                    : <div>loading...</div>
                )}
            </div>
        </div>
    )
}