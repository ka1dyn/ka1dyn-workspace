import { PUBLIC_IMAGES } from "@/constants/images";

interface CardProps {
  name: string;
  thumbnail: string;
  pCnt: number;
  onClick: () => void;
  children?: React.ReactNode;
}

export default function Card({
  thumbnail,
  name,
  pCnt,
  onClick,
  children,
}: CardProps) {
  return (
    <div
      className="flex flex-col w-110 h-140 rounded-xl shadow-md overflow-hidden cursor-pointer relative
      hover:-translate-y-2 hover:shadow-xl transition-all duration-200 ease-ou border"
      onClick={onClick}
    >
      <div className="w-full h-70 overflow-hidden flex items-center mb-2">
        <img src={thumbnail} className="w-full" />
      </div>

      <div className="flex flex-col px-4 py-4">
        <div className="font-semibold mb-5">{name}</div>
        <div className="">{children}</div>
      </div>

      <div className="absolute bottom-4 right-4 text-muted-foreground font-light bg-accent/50 px-3 py-2 rounded-xl">
        {pCnt}인 개발
      </div>
    </div>
  );
}
