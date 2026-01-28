import { cn } from "@/lib/utils";
import { useModalStore } from "@/stores";
import { BackgroundTypes } from "@/types/enums";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function Dock({
  className,
  setImgSrc,
}: {
  className?: string;
  setImgSrc: (path: string) => void;
}) {
  const thumnailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [bgType, setBgType] = useState<BackgroundTypes>(BackgroundTypes.DOG);
  const [indicatorOffset, setIndicatorOffset] = useState<number>(0);
  const modals = useModalStore((state) => state.modals);

  const clickThumnail = (type: BackgroundTypes) => {
    setBgType(type);
  };

  useLayoutEffect(() => {
    const curThumnail = thumnailRefs.current[bgType];
    if (!curThumnail) return;

    setIndicatorOffset(curThumnail.offsetLeft);
  }, [bgType]);

  useEffect(() => {
    switch (bgType) {
      case BackgroundTypes.DOG:
        setImgSrc("/images/happy_dog.webp");
        break;
      case BackgroundTypes.BIKE:
        setImgSrc("/images/bike_rain.webp");
        break;
      case BackgroundTypes.CITY:
        setImgSrc("/images/city_rain.webp");
        break;
      default:
        return;
    }
  }, [bgType]);

  return (
    <div
      className={cn(
        "relative flex gap-6 items-center px-4 h-22 bg-gray-500/50 backdrop-blur-sm rounded-t-2xl w-fit",
        className,
      )}
    >
      <div className="h-full flex gap-6 justify-center items-center -translate-y-1">
        <div
          ref={(node) => {
            thumnailRefs.current[0] = node;
          }}
          className="relative cursor-pointer size-16 rounded-xl bg-[url(/images/happy_dog_thumbnail.jpg)] bg-center bg-no-repeat bg-cover hover:shadow-lg/50 shadow-white"
          onClick={() => clickThumnail(BackgroundTypes.DOG)}
        ></div>
        <div
          ref={(node) => {
            thumnailRefs.current[1] = node;
          }}
          className="relative cursor-pointer size-16 rounded-xl bg-[url(/images/bike_rain_thumbnail.jpg)] bg-center bg-no-repeat bg-cover hover:shadow-lg/50 shadow-white"
          onClick={() => clickThumnail(BackgroundTypes.BIKE)}
        ></div>
        <div
          ref={(node) => {
            thumnailRefs.current[2] = node;
          }}
          className="relative cursor-pointer size-16 rounded-xl bg-[url(/images/city_rain_thumbnail.jpg)] bg-center bg-no-repeat bg-cover hover:shadow-lg/50 shadow-white"
          onClick={() => clickThumnail(BackgroundTypes.CITY)}
        ></div>
        <div
          className={`absolute bottom-0 left-8 size-1.25 rounded-full bg-white transition-all duration-400 ease-in-out`}
          style={{
            transform: `translateX(calc(${indicatorOffset}px - 50%))`,
          }}
        ></div>
      </div>
      {Object.values(modals).some((modal) => modal.isOpen) && (
        <>
          <div className="w-0.5 h-1/2 rounded-full bg-[#b4b4b4] -translate-y-1"></div>
          <div className="h-full flex gap-6 justify-center items-center -translate-y-1">
            {Object.values(modals).map(
              (modal) =>
                modal.isOpen && (
                  <div
                    className="relative flex items-center h-full"
                    key={modal.name}
                  >
                    <div className="flex justify-center items-center cursor-pointer size-16 rounded-xl bg-amber-50 hover:shadow-lg/50 shadow-white animate-dock-add">
                      <span className="break-all text-center lg:text-[16px]">
                        {modal.name}
                      </span>
                    </div>
                    <div
                      className={`absolute bottom-0 left-8 size-1.25 rounded-full bg-white`}
                      style={{
                        transform: `translateX(-50%))`,
                      }}
                    ></div>
                  </div>
                ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
