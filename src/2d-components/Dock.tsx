import { cn } from "@/lib/utils";
import { BackgroundTypes } from "@/types/enums";
import { useEffect, useRef, useState } from "react";

export default function Dock({
  className,
  setImgSrc,
}: {
  className?: string;
  setImgSrc: (path: string) => void;
}) {
  const [bgType, setBgType] = useState<BackgroundTypes>(BackgroundTypes.DOG);
  const indicatorRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevRef = useRef<HTMLDivElement>(null!);

  const clickThumnail = (type: BackgroundTypes) => {
    // Indicator move
    const curDiv = indicatorRefs.current[type] as HTMLDivElement;

    curDiv.style.backgroundColor = "gray";
    console.log(curDiv.style.backgroundColor);

    if (type === BackgroundTypes.BIKE) {
      setBgType(type);
    }
  };

  useEffect(() => {
    if (!prevRef.current) {
      prevRef.current = indicatorRefs.current[bgType] as HTMLDivElement;
      return;
    }

    switch (bgType) {
      case BackgroundTypes.DOG:
        setImgSrc("/images/happy_dog.webp");
        prevRef.current = indicatorRefs.current[
          BackgroundTypes.DOG
        ] as HTMLDivElement;
        break;
      case BackgroundTypes.BIKE:
        setImgSrc("/images/bike_rain.webp");
        prevRef.current = indicatorRefs.current[
          BackgroundTypes.BIKE
        ] as HTMLDivElement;
        break;
      case BackgroundTypes.CITY:
        setImgSrc("/images/city_rain.webp");
        prevRef.current = indicatorRefs.current[
          BackgroundTypes.CITY
        ] as HTMLDivElement;
        break;
      default:
        return;
    }
  }, [bgType]);

  return (
    <div
      className={cn(
        "relative px-4 h-22 bg-gray-500/50 backdrop-blur-sm rounded-t-2xl w-fit",
        className,
      )}
    >
      <div className="w-full h-full flex gap-6 justify-center items-center -translate-y-1">
        <div
          className="relative cursor-pointer size-16 bg-amber-100 rounded-xl bg-[url(/images/happy_dog_thumbnail.jpg)] bg-center bg-no-repeat bg-cover hover:shadow-lg/50 shadow-white"
          onClick={() => clickThumnail(BackgroundTypes.DOG)}
        >
          <div
            style={{ backgroundColor: "black" }}
            ref={(el) => {
              indicatorRefs.current[0] = el;
            }}
            className="absolute -bottom-2.75 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-black"
          ></div>
        </div>
        <div
          className="relative cursor-pointer size-16 bg-amber-100 rounded-xl bg-[url(/images/bike_rain_thumbnail.jpg)] bg-center bg-no-repeat bg-cover hover:shadow-lg/50 shadow-white"
          onClick={() => clickThumnail(BackgroundTypes.BIKE)}
        >
          <div
            ref={(el) => {
              indicatorRefs.current[1] = el;
            }}
            className="absolute -bottom-2.75 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-black"
          ></div>
        </div>
        <div
          className="relative cursor-pointer size-16 bg-amber-100 rounded-xl bg-[url(/images/city_rain_thumbnail.jpg)] bg-center bg-no-repeat bg-cover hover:shadow-lg/50 shadow-white"
          onClick={() => clickThumnail(BackgroundTypes.CITY)}
        >
          <div
            ref={(el) => {
              indicatorRefs.current[2] = el;
            }}
            className="absolute -bottom-2.75 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-black"
          ></div>
        </div>
        <div className="absolute left-0 bottom-0 "></div>
      </div>
    </div>
  );
}
