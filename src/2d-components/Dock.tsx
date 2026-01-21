import { cn } from "@/lib/utils";

export default function Dock({
  className,
  setImgSrc,
}: {
  className?: string;
  setImgSrc: (path: string) => void;
}) {
  const clickThumnail = (type: number) => {
    switch (type) {
      case 0:
        setImgSrc("/images/happy_dog.webp");
        break;
      case 1:
        setImgSrc("/images/bike_rain.webp");
        break;
      case 2:
        setImgSrc("/images/city_rain.webp");
        break;
      default:
        return;
    }
  };

  return (
    <div
      className={cn(
        "relative px-4 h-22 bg-gray-500/50 backdrop-blur-sm rounded-t-2xl w-fit",
        className,
      )}
    >
      <div className="w-full h-full flex gap-6 justify-center items-center -translate-y-1">
        <div
          className="cursor-pointer size-16 bg-amber-100 rounded-xl bg-[url(/images/happy_dog_thumbnail.jpg)] bg-center bg-no-repeat bg-cover hover:shadow-lg/50 shadow-white"
          onClick={() => clickThumnail(0)}
        ></div>
        <div
          className="cursor-pointer size-16 bg-amber-100 rounded-xl bg-[url(/images/bike_rain_thumbnail.jpg)] bg-center bg-no-repeat bg-cover hover:shadow-lg/50 shadow-white"
          onClick={() => clickThumnail(1)}
        ></div>
        <div
          className="cursor-pointer size-16 bg-amber-100 rounded-xl bg-[url(/images/city_rain_thumbnail.jpg)] bg-center bg-no-repeat bg-cover hover:shadow-lg/50 shadow-white"
          onClick={() => clickThumnail(2)}
        ></div>
        <div className="absolute left-0 bottom-0 "></div>
      </div>
    </div>
  );
}
