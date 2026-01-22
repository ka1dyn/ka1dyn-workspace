import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

type ViewPos = {
  x: number;
  y: number;
};

export default function InfoModal({ className = "" }: { className?: string }) {
  const modalRef = useRef<HTMLDivElement>(null!);
  const headerRef = useRef<HTMLDivElement>(null!);
  const prevPosRef = useRef<ViewPos>({ x: 0, y: 0 });
  const pressed = useRef<boolean>(false);

  useEffect(() => {
    const headerDiv = headerRef.current;
    const modalDiv = modalRef.current;
    if (!headerDiv || !modalDiv) return;

    headerDiv.addEventListener("mousedown", (e) => {
      pressed.current = true;

      prevPosRef.current.x = e.clientX - modalDiv.offsetLeft;
      prevPosRef.current.y = e.clientY - modalDiv.offsetTop;
    });

    window.addEventListener("mouseup", () => {
      pressed.current = false;
    });

    window.addEventListener("mousemove", (e) => {
      if (!pressed.current) return;
      console.log(window.innerWidth > e.clientX, window.innerHeight);
      if (
        window.innerWidth < e.clientX ||
        e.clientX < 0 ||
        window.innerHeight < e.clientY - 10
      ) {
        return;
      }
      let newLeft = e.clientX - prevPosRef.current.x;
      let newTop = e.clientY - prevPosRef.current.y;

      const minTop = 64;
      newTop = Math.max(minTop, newTop);

      modalDiv.style.left = `${newLeft}px`;
      modalDiv.style.top = `${newTop}px`;
    });

    // window.addEventListener("resize", (e) => {});
  }, []);

  return (
    <div
      ref={modalRef}
      className={cn(
        "w-260 h-150 bg-white rounded-4xl overflow-hidden absolute top-20 left-20",
        className,
      )}
    >
      <div ref={headerRef} className="h-10 bg-gray-400"></div>
    </div>
  );
}
