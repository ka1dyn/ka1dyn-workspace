import { cn } from "@/lib/utils";
import { useEffect, useRef, type RefObject } from "react";
import ResizeIcon from "@/icons/resize.svg?react";
import { useModalStack } from "@/stores";

export default function InfoModal({
  className = "",
  name,
  style,
  modalRef,
  active,
  setActive,
}: {
  className?: string;
  name: string;
  modalRef: RefObject<HTMLDivElement>;
  active: boolean;
  style: Object;
  setActive: any;
}) {
  const getNextStack = useModalStack((state) => state.getNextStack);

  const bringToFront = () => {
    if (modalRef.current) {
      modalRef.current.style.zIndex = getNextStack().toString();
    }
  };

  useEffect(() => {
    bringToFront();
  }, [active]);

  useEffect(() => {
    const resizeModalBoundary = () => {
      const modalDiv = modalRef.current;
      const modalContainer = document.getElementById("modals");

      const offsetLeft = modalDiv.offsetLeft;
      const offsetTop = modalDiv.offsetTop;

      const screenWidth = modalContainer?.offsetWidth as number;
      const screenHeight = modalContainer?.offsetHeight as number;

      if (offsetLeft > screenWidth)
        modalDiv.style.left = `${screenWidth - 30}px`;
      if (offsetTop > screenHeight)
        modalDiv.style.top = `${screenHeight - 30}px`;
    };

    window.addEventListener("resize", resizeModalBoundary);

    return () => {
      window.removeEventListener("resize", resizeModalBoundary);
    };
  }, []);

  const panningHandler = (e: React.MouseEvent) => {
    const modalDiv = modalRef.current;
    const modalContainer = document.getElementById("modals");

    const initModalX = modalDiv.offsetLeft;
    const initModalY = modalDiv.offsetTop;

    const initClientX = e.clientX;
    const initClientY = e.clientY;

    const cursorOffsetX = e.nativeEvent.offsetX;
    const cursorOffsetY = e.nativeEvent.offsetY;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const rect = modalDiv.getBoundingClientRect();

      const scaleX = rect.width / modalDiv.offsetWidth;
      const scaleY = rect.height / modalDiv.offsetHeight;

      let newLeft = initModalX + (moveEvent.clientX - initClientX) / scaleX;
      let newTop = initModalY + (moveEvent.clientY - initClientY) / scaleY;

      const screenWidth = modalContainer?.offsetWidth as number;
      const screenHeight = modalContainer?.offsetHeight as number;

      const minTop = 64; // Fix hardcoding
      const maxTop = screenHeight - cursorOffsetY - 20;
      const minLeft = -cursorOffsetX;
      const maxLeft = screenWidth - cursorOffsetX;
      newTop = Math.max(minTop, newTop);
      newTop = Math.min(maxTop, newTop);
      newLeft = Math.max(minLeft, newLeft);
      newLeft = Math.min(maxLeft, newLeft);

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
    const modalDiv = modalRef.current;
    const modalContainer = document.getElementById("modals");
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = modalDiv.offsetWidth;
    const startHeight = modalDiv.offsetHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const rect = modalDiv.getBoundingClientRect();

      const scaleX = rect.width / modalDiv.offsetWidth;
      const scaleY = rect.height / modalDiv.offsetHeight;

      const screenWidth = modalContainer?.offsetWidth as number;
      const screenHeight = modalContainer?.offsetHeight as number;

      let newWidth = startWidth + (moveEvent.clientX - startX) / scaleX;
      let newHeight = startHeight + (moveEvent.clientY - startY) / scaleY;

      const minWidth = 300;
      const maxWidth = screenWidth * 0.9;
      const minHeight = 200;
      const maxHeight = screenHeight * 0.9;

      newWidth = Math.max(minWidth, newWidth);
      newWidth = Math.min(newWidth, maxWidth);
      newHeight = Math.max(minHeight, newHeight);
      newHeight = Math.min(newHeight, maxHeight);

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
      style={style}
      ref={modalRef}
      className={cn(
        "w-260 h-150 bg-transparent rounded-md overflow-hidden border border-gray-300 shadow-2xl shadow-[#00000052] pointer-events-auto relative",
        className,
      )}
      onMouseDown={() => bringToFront()}
    >
      <div
        className="absolute top-0 left-0 w-full h-13 bg-transparent z-10"
        onMouseDown={panningHandler}
      ></div>

      <div
        className="absolute bottom-0 right-0 size-5 cursor-nwse-resize bg-transparent z-10"
        onMouseDown={resizeHandler}
      >
        <ResizeIcon className="w-full h-full text-gray-400" />
      </div>

      <div className="absolute top-0 left-0 h-13 flex items-center p-5 gap-2 z-15">
        <div
          className="size-3 cursor-pointer rounded-full bg-[rgb(255,95,87)]"
          onClick={() => setActive(false)}
        ></div>
        <div className="size-3 cursor-pointer rounded-full bg-[rgb(255,188,46)]"></div>
        <div className="size-3 cursor-pointer rounded-full bg-[rgb(43,200,64)]"></div>
      </div>

      <div className="flex w-full h-full">
        <div className="flex flex-col w-42 bg-[#d6d6d6]/80 backdrop-blur-2xl border-r-2 border-[#cecece]">
          {/* <div className="h-13 flex items-center p-5 gap-2">
            <div
              className="size-3 cursor-pointer rounded-full bg-[rgb(255,95,87)]"
              onClick={() => setActive(false)}
            ></div>
            <div
              className="size-3 cursor-pointer rounded-full bg-[rgb(255,188,46)]"
              onClick={() => setActive(false)}
            ></div>
            <div
              className="size-3 cursor-pointer rounded-full bg-[rgb(43,200,64)]"
              onClick={() => setActive(false)}
            ></div>
          </div> */}
        </div>
        <div className="flex flex-col w-full z-5">
          <div className="h-13 bg-[#f0f0f0] text-[#525252] flex items-center py-3 px-5 border-b border-[#e5e5e5]">
            <span>{name}</span>
          </div>
          <div className="bg-white h-full"></div>
        </div>
      </div>

      {/* <div
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
      <button
        className="text-2xl cursor-pointer"
        onClick={() => setActive(false)}
      >
        exit
      </button> */}
    </div>
  );
}
