interface CardProps {
  name: string;
  onClick: () => void;
  children?: React.ReactNode;
}

export default function Card({ name, onClick, children }: CardProps) {
  return (
    <div
      className="flex flex-col w-110 h-140 rounded-xl shadow-md overflow-hidden cursor-pointer relative
      hover:-translate-y-2 hover:shadow-xl transition-all duration-200 ease-out"
      onClick={onClick}
    >
      <img src="/images/city_rain_thumbnail.jpg" className="w-full h-70" />
      <div className="flex flex-col px-2 py-4">
        <div className="font-semibold mb-5">{name}</div>
        <div className="">{children}</div>
      </div>
    </div>
  );
}
