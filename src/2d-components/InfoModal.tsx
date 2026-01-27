import { cn } from "@/lib/utils";
import { useEffect, type RefObject } from "react";
import ResizeIcon from "@/icons/resize.svg?react";
import CloseIcon from "@/icons/close.svg?react";
import RemoveIcon from "@/icons/remove.svg?react";
import ExpandIcon from "@/icons/expand.svg?react";
import CollapseIcon from "@/icons/collapse.svg";
import { useModalStack } from "@/stores";
import MDViewer from "./MDViewer";

interface InfoModalProps {
  className?: string;
  name: string;
  modalRef: RefObject<HTMLDivElement>;
  active: boolean;
  style: Object;
  setActive: any;
  navActive: boolean;
}

export default function InfoModal({
  className = "",
  name,
  style,
  modalRef,
  active,
  setActive,
  navActive,
}: InfoModalProps) {
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
      if (!modalDiv) return;

      const modalContainer = document.getElementById("modals");
      if (!modalContainer) return;

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
    if (!modalContainer) return;

    const initModalX = modalDiv.offsetLeft;
    const initModalY = modalDiv.offsetTop;

    const initClientX = e.clientX;
    const initClientY = e.clientY;

    const cursorOffsetX = e.nativeEvent.offsetX;
    const cursorOffsetY = e.nativeEvent.offsetY;

    const style = window.getComputedStyle(modalDiv);
    const modalScale = Number(style.scale == "none" ? 1 : style.scale);

    const rect = modalDiv.getBoundingClientRect();

    const scaleX = rect.width / modalDiv.offsetWidth / modalScale;
    const scaleY = rect.height / modalDiv.offsetHeight / modalScale;

    const onMouseMove = (moveEvent: MouseEvent) => {
      let newLeft = initModalX + (moveEvent.clientX - initClientX) / scaleX;
      let newTop = initModalY + (moveEvent.clientY - initClientY) / scaleY;

      const screenWidth = modalContainer?.offsetWidth as number;
      const screenHeight = modalContainer?.offsetHeight as number;

      const minTop = 64; // Fix hardcoding
      const maxTop = screenHeight - cursorOffsetY * modalScale - 20;
      const minLeft = -cursorOffsetX * modalScale;
      const maxLeft = screenWidth - cursorOffsetX * modalScale;
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

    const style = window.getComputedStyle(modalDiv);
    const modalScale = Number(style.scale == "none" ? 1 : style.scale);

    const rect = modalDiv.getBoundingClientRect();

    const scaleX = rect.width / modalDiv.offsetWidth / modalScale;
    const scaleY = rect.height / modalDiv.offsetHeight / modalScale;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const screenWidth = modalContainer?.offsetWidth as number;
      const screenHeight = modalContainer?.offsetHeight as number;

      let newWidth =
        startWidth + (moveEvent.clientX - startX) / scaleX / modalScale;
      let newHeight =
        startHeight + (moveEvent.clientY - startY) / scaleY / modalScale;

      const minWidth = 300;
      const maxWidth = (screenWidth * 0.9) / modalScale;
      const minHeight = 200;
      const maxHeight = (screenHeight * 0.9) / modalScale;

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
        "@container w-260 h-150 bg-transparent rounded-lg overflow-hidden border border-gray-300 shadow-2xl shadow-[#00000052] pointer-events-auto relative",
        // "scale-[clamp(0.6,calc(100cqh/1080px),1.5)] origin-top-left",
        "origin-top-left",
        className,
      )}
      onMouseDown={() => bringToFront()}
    >
      <div
        className="absolute top-0 left-0 w-full h-13 bg-transparent cursor-move z-10"
        onMouseDown={panningHandler}
      ></div>

      <div
        className="absolute bottom-0 right-0 size-5 cursor-nwse-resize bg-transparent z-10"
        onMouseDown={resizeHandler}
      >
        <ResizeIcon className="w-full h-full text-gray-400" />
      </div>

      <div className="absolute top-0 left-0 w-24 h-13 flex items-center justify-center z-15 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto group">
          <div
            className="size-3 rounded-full bg-[rgb(255,95,87)] flex justify-center items-center"
            onClick={() => setActive(false)}
          >
            <CloseIcon className="size-2.5 hidden group-hover:block" />
          </div>
          <div className="size-3 rounded-full bg-[rgb(255,188,46)] flex justify-center items-center">
            <RemoveIcon className="size-2.5 hidden group-hover:block" />
          </div>
          <div className="size-3 rounded-full bg-[rgb(43,200,64)] flex justify-center items-center">
            <ExpandIcon className="size-2.5 hidden group-hover:block" />
          </div>
        </div>
      </div>

      <div className="flex w-full h-full">
        <div
          className={cn(
            "flex flex-col w-42 shrink-0 bg-[#d6d6d6]/80 backdrop-blur-2xl border-r-2 border-[#cecece] transition-all duration-200 ease-out",
            navActive ? "hidden @4xl:block" : "hidden",
          )}
        ></div>
        <div className="flex flex-col flex-1 z-5">
          <div
            className={cn(
              "h-13 bg-[#f0f0f0] text-[#525252] flex items-center py-3 border-b border-[#e5e5e5] translate-y-px",
              navActive ? "px-24 @4xl:px-5" : "px-24",
            )}
          >
            <span>{name}</span>
          </div>
          <div className="bg-white w-full h-full overflow-auto flex flex-col items-center px-15">
            <MDViewer path={"/content/test.md"} />
          </div>
        </div>
      </div>
    </div>
  );
}
