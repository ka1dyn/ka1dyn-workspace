import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import ResizeIcon from "@/icons/resize.svg?react";

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

      const rect = modalDiv.getBoundingClientRect();
      const offsetLeft = rect.x;
      const offsetTop = rect.y;

      prevPosRef.current.x = e.clientX - offsetLeft;
      prevPosRef.current.y = e.clientY - offsetTop;
    });

    window.addEventListener("mouseup", () => {
      pressed.current = false;
    });

    window.addEventListener("mousemove", (e) => {
      if (!pressed.current) return;

      // Mouse outside browser
      if (
        window.innerWidth < e.clientX ||
        e.clientX < 0 ||
        window.innerHeight < e.clientY - 10
      ) {
        return;
      }
      let newLeft = e.clientX - prevPosRef.current.x;
      let newTop = e.clientY - prevPosRef.current.y;

      const minTop = 64; // Fix hardcoding
      newTop = Math.max(minTop, newTop);

      modalDiv.style.left = `${newLeft}px`;
      modalDiv.style.top = `${newTop}px`;
    });

    window.addEventListener("resize", (e) => {
      const rect = modalDiv.getBoundingClientRect();
      const offsetLeft = rect.x;
      const offsetTop = rect.y;

      if (offsetLeft > window.innerWidth)
        modalDiv.style.left = `${window.innerWidth - 30}px`;
      if (offsetTop > window.innerHeight)
        modalDiv.style.top = `${window.innerHeight - 30}px`;
    });
  }, []);

  const resizeHandler = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = modalRef.current.offsetWidth;
    const startHeight = modalRef.current.offsetHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      let newWidth = startWidth + (moveEvent.clientX - startX);
      let newHeight = startHeight + (moveEvent.clientY - startY);

      if (newWidth < 300) newWidth = 300;
      if (newHeight < 200) newHeight = 200;

      modalRef.current.style.width = `${newWidth}px`;
      modalRef.current.style.height = `${newHeight}px`;
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      ref={modalRef}
      className={cn(
        "w-260 h-150 bg-white rounded-md overflow-hidden",
        className,
      )}
    >
      <div ref={headerRef} className="h-10 bg-gray-400 cursor-move"></div>
      <div
        className="absolute bottom-0 right-0 size-5 cursor-nwse-resize bg-transparent"
        onMouseDown={resizeHandler}
      >
        <ResizeIcon className="w-full h-full text-gray-400" />
      </div>
    </div>
  );
}
