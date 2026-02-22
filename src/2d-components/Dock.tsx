import { cn } from "@/lib/utils";
import { useBgImageStore, useModalStore } from "@/stores";
import { useLayoutEffect, useRef, useState } from "react";
import ModalDockItem from "./ModalDockItem";
import React from "react";
import { useShallow } from "zustand/shallow";
import { PUBLIC_IMAGES } from "@/constants/images";

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
      case PUBLIC_IMAGES.DOG:
        type = 0;
        break;
      case PUBLIC_IMAGES.BIKE:
        type = 1;
        break;
      case PUBLIC_IMAGES.CITY:
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
          className="relative cursor-pointer size-16 rounded-xl bg-center bg-no-repeat bg-cover hover:shadow-lg/50 shadow-white"
          style={{
            backgroundImage: `url(${PUBLIC_IMAGES.DOG_THUMBNAIL})`,
          }}
          onClick={() => changeBackground(PUBLIC_IMAGES.DOG)}
        ></div>
        <div
          ref={(node) => {
            thumnailRefs.current[1] = node;
          }}
          className="relative cursor-pointer size-16 rounded-xl bg-center bg-no-repeat bg-cover hover:shadow-lg/50 shadow-white"
          onClick={() => changeBackground(PUBLIC_IMAGES.BIKE)}
          style={{
            backgroundImage: `url(${PUBLIC_IMAGES.BIKE_THUMBNAIL})`,
          }}
        ></div>
        <div
          ref={(node) => {
            thumnailRefs.current[2] = node;
          }}
          className="relative cursor-pointer size-16 rounded-xl bg-center bg-no-repeat bg-cover hover:shadow-lg/50 shadow-white"
          onClick={() => changeBackground(PUBLIC_IMAGES.CITY)}
          style={{
            backgroundImage: `url(${PUBLIC_IMAGES.CITY_THUMBNAIL})`,
          }}
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
