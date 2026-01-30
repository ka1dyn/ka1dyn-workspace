import { cn } from "@/lib/utils";
import { useBgImageStore, useModalStore } from "@/stores";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ModalDockItem from "./ModalDockItem";
import React from "react";
import { useShallow } from "zustand/shallow";

export default function Dock({ className }: { className?: string }) {
  const thumnailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [indicatorOffset, setIndicatorOffset] = useState<number>(0);
  const { path, changeBackground } = useBgImageStore(
    useShallow((state) => ({
      ...state,
    })),
  );
  const modals = useModalStore((state) => state.modals);

  useLayoutEffect(() => {
    let type = 0;

    switch (path) {
      case "/images/happy_dog.webp":
        type = 0;
        break;
      case "/images/bike_rain.webp":
        type = 1;
        break;
      case "/images/city_rain.webp":
        type = 2;
        break;
    }

    const curThumnail = thumnailRefs.current[type];
    if (!curThumnail) return;

    setIndicatorOffset(curThumnail.offsetLeft);
  }, [path]);

  const someModalOpen = Object.keys(modals).length > 0;

  return (
    <div
      className={cn(
        "relative flex items-center px-4 h-22 bg-gray-500/50 backdrop-blur-sm rounded-t-2xl w-fit",
        className,
      )}
    >
      <div className="h-full flex gap-6 justify-center items-center -translate-y-1">
        <div
          ref={(node) => {
            thumnailRefs.current[0] = node;
          }}
          className="relative cursor-pointer size-16 rounded-xl bg-[url(/images/happy_dog_thumbnail.jpg)] bg-center bg-no-repeat bg-cover hover:shadow-lg/50 shadow-white"
          onClick={() => changeBackground("/images/happy_dog.webp")}
        ></div>
        <div
          ref={(node) => {
            thumnailRefs.current[1] = node;
          }}
          className="relative cursor-pointer size-16 rounded-xl bg-[url(/images/bike_rain_thumbnail.jpg)] bg-center bg-no-repeat bg-cover hover:shadow-lg/50 shadow-white"
          onClick={() => changeBackground("/images/bike_rain.webp")}
        ></div>
        <div
          ref={(node) => {
            thumnailRefs.current[2] = node;
          }}
          className="relative cursor-pointer size-16 rounded-xl bg-[url(/images/city_rain_thumbnail.jpg)] bg-center bg-no-repeat bg-cover hover:shadow-lg/50 shadow-white"
          onClick={() => changeBackground("/images/city_rain.webp")}
        ></div>
        <div
          className={`absolute bottom-0 left-8 size-1.25 rounded-full bg-white transition-all duration-400 ease-in-out`}
          style={{
            transform: `translateX(calc(${indicatorOffset}px - 50%))`,
          }}
        ></div>
      </div>
      <div className="h-full flex gap-6 justify-center items-center -translate-y-1">
        {
          <div
            className={cn(
              "w-0.5 h-1/2 ml-6 rounded-full bg-[#b4b4b4] transition-all duration-300",
              someModalOpen ? "ml-6 opacity-100" : "ml-0 opacity-0",
            )}
          ></div>
        }
        {Object.values(modals).map((modal) => (
          <React.Fragment key={modal.name}>
            <ModalDockItem name={modal.name} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
