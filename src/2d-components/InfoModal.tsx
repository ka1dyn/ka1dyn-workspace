import { cn } from "@/lib/utils";
import { useEffect, useRef, type RefObject } from "react";
import ResizeIcon from "@/icons/resize.svg?react";
import { useModalStack } from "@/stores";

export default function InfoModal({
  className = "",
  modalRef,
}: {
  className?: string;
  modalRef: RefObject<HTMLDivElement>;
}) {
  const headerRef = useRef<HTMLDivElement>(null!);
  const getNextStack = useModalStack((state) => state.getNextStack);

  const bringToFront = () => {
    if (modalRef.current) {
      modalRef.current.style.zIndex = getNextStack().toString();
    }
  };

  useEffect(() => {
    const resizeModalBoundary = () => {
      const modalDiv = modalRef.current;
      const rect = modalDiv.getBoundingClientRect();
      const offsetLeft = rect.x;
      const offsetTop = rect.y;

      if (offsetLeft > window.innerWidth)
        modalDiv.style.left = `${window.innerWidth - 30}px`;
      if (offsetTop > window.innerHeight)
        modalDiv.style.top = `${window.innerHeight - 30}px`;
    };

    window.addEventListener("resize", resizeModalBoundary);

    return () => {
      window.removeEventListener("resize", resizeModalBoundary);
    };
  }, []);

  const panningHandler = (e: React.MouseEvent) => {
    const modalDiv = modalRef.current;
    const rect = modalDiv.getBoundingClientRect();
    const offsetLeft = rect.x;
    const offsetTop = rect.y;

    const prevX = e.clientX - offsetLeft;
    const prevY = e.clientY - offsetTop;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (
        window.innerWidth < moveEvent.clientX ||
        moveEvent.clientX < 0 ||
        window.innerHeight < moveEvent.clientY - 10
      ) {
        return;
      }
      let newLeft = moveEvent.clientX - prevX;
      let newTop = moveEvent.clientY - prevY;

      const minTop = 64; // Fix hardcoding
      newTop = Math.max(minTop, newTop);

      modalDiv.style.left = `${newLeft}px`;
      modalDiv.style.top = `${newTop}px`;
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

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
        "w-260 h-150 bg-white rounded-md overflow-hidden border border-gray-300 shadow-2xl",
        className,
      )}
      onMouseDown={() => bringToFront()}
    >
      <div
        ref={headerRef}
        className="h-10 bg-gray-400 cursor-move"
        onMouseDown={panningHandler}
      ></div>
      <div
        className="absolute bottom-0 right-0 size-5 cursor-nwse-resize bg-transparent"
        onMouseDown={resizeHandler}
      >
        <ResizeIcon className="w-full h-full text-gray-400" />
      </div>
    </div>
  );
}
