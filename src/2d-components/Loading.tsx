import { useEffect, useRef, useState } from "react";
import { scramble, TextScramble } from "../animations/textScramble";
import { useReady, useStart } from "../stores";

export default function Loading() {
  const textRef1 = useRef<HTMLDivElement>(null!);
  const textRef2 = useRef<HTMLDivElement>(null!);
  const textRef3 = useRef<HTMLDivElement>(null!);
  const textRef4 = useRef<HTMLDivElement>(null!);
  const [ready, setReady] = useState<boolean>(false);
  const setStart = useStart((state) => state.setStart);
  const frameReady = useReady((state) => state.frameReady);

  const btnClick = () => {
    setStart(true);
  };

  useEffect(() => {
    if (!textRef1.current || !textRef2.current || !textRef3.current) return;

    const textAnimation = async () => {
      const phrases = [
        "Hello,",
        "welcome to Ka1dyn's workspace",
        "sound recommended for the full experience.",
        "click below to start",
      ];

      const fx1 = new TextScramble(textRef1.current);
      const fx2 = new TextScramble(textRef2.current);
      const fx3 = new TextScramble(textRef3.current);
      const fx4 = new TextScramble(textRef4.current);

      await scramble(fx1, phrases[0]);
      await scramble(fx2, phrases[1]);
      await scramble(fx3, phrases[2]);
      await scramble(fx4, phrases[3]);

      setReady(true);
    };

    textAnimation();
  }, []);

  return (
    <div className="w-screen h-screen absolute top-0 bg-[#212121] flex justify-center items-center z-10000001">
      <div className="w-1/2 flex flex-col">
        <div
          className="text-[#fafafa] text-xl font-thin font-roboto"
          ref={textRef1}
        ></div>
        <div
          className="text-[#fafafa] text-xl font-thin font-roboto"
          ref={textRef2}
        ></div>
        <div
          className="text-[#fafafa] text-xl font-thin font-roboto"
          ref={textRef3}
        ></div>
        <div
          className="text-[#fafafa] text-xl font-thin font-roboto"
          ref={textRef4}
        ></div>
        <div className="h-16 text-white text-[18px] font-roboto font-medium pt-16">
          {/* <span>loading...</span> */}

          {ready &&
            (frameReady ? (
              <button
                className="
                relative
                after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-transparent
                hover:after:bg-white hover:cursor-pointer"
                onClick={btnClick}
              >
                start
              </button>
            ) : (
              <div>loading...</div>
            ))}
        </div>
      </div>
    </div>
  );
}
