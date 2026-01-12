interface NavButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  children: React.ReactNode;
  clicked: boolean;
}

export default function NavButton({
  children,
  clicked,
  className,
  ...props
}: NavButtonProps) {
  return (
    <button
      {...props}
      className={`
                w-14 h-14 bg-transparent
                text-[#c9c9c9] text-[18px]/[18px] font-medium font-roboto
                flex justify-center items-center
                border border-[#ffffff2c]
                relative

                cursor-pointer pointer-events-auto

                group
                ${className || ""}
            `}
    >
      <span
        className={`absolute w-0 h-px left-0 top-0 bg-[#ffffff50] transition-all duration-300 ease-out group-hover:w-full group-hover:bg-white ${clicked && "w-full bg-white"}`}
      ></span>
      <span
        className={`absolute h-0 w-px right-0 top-0 bg-[#ffffff50] transition-all duration-300 ease-out group-hover:h-full group-hover:bg-white ${clicked && "h-full bg-white"}`}
      ></span>
      <span
        className={`absolute w-0 h-px right-0 bottom-0 bg-[#ffffff50] transition-all duration-300 ease-out group-hover:w-full group-hover:bg-white ${clicked && "w-full bg-white"}`}
      ></span>
      <span
        className={`absolute h-0 w-px left-0 bottom-0 bg-[#ffffff50] transition-all duration-300 ease-out group-hover:h-full group-hover:bg-white ${clicked && "h-full bg-white"}`}
      ></span>
      {children}
    </button>
  );
}
