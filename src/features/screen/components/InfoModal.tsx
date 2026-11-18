import { cn } from "@/shared/utils";
import { useEffect, useLayoutEffect, useRef } from "react";
import ResizeIcon from "../icons/resize.svg?react";
import CloseIcon from "../icons/close.svg?react";
import RemoveIcon from "../icons/remove.svg?react";
import ExpandIcon from "../icons/expand.svg?react";
import CollapseIcon from "../icons/collapse.svg?react";
import { useTweaks } from "@/shared/stores";
import { useModalStore, useModalViewStore } from "../stores";
import { useShallow } from "zustand/shallow";
import NavContent from "./NavContent";
import MDContent from "./MDContent";
import type { ModalPos } from "../types";

interface InfoModalProps {
  className?: string;
  name: string;
  navActive?: boolean;
}

export default function InfoModal({
  className = "",
  name,
  navActive = true,
}: InfoModalProps) {
  const modalState = useModalStore((state) => state.modals[name]);
  const zIndex = modalState.zIndex;
  const {
    bringToFront,
    closeModalStart,
    downupModal,
    expandModal,
    collapseModal,
  } = useModalStore(
    useShallow((state) => ({
      bringToFront: state.bringToFront,
      closeModalStart: state.closeModalStart,
      downupModal: state.downupModal,
      expandModal: state.expandModal,
      collapseModal: state.collapseModal,
    })),
  );
  const modalRef = useRef<HTMLDivElement>(null!);
  const dive = useTweaks((state) => state.dive);

  // Not subscribe, just read (always same with DOM)
  const rect = useModalViewStore.getState().rects[name];
  const style = modalState.isFull
    ? {
        top: "64px",
        left: "0px",
        width: "100%",
        height: "calc(100% - 64px)",
        zIndex,
      }
    : {
        top: rect.y,
        left: rect.x,
        width: rect.width,
        height: rect.height,
        zIndex,
      };

  // Update DOM + store together, no rerender
  const applyRect = (next: Partial<ModalPos>) => {
    const modalDiv = modalRef.current;
    if (!modalDiv) return;

    if (next.x !== undefined) modalDiv.style.left = `${next.x}px`;
    if (next.y !== undefined) modalDiv.style.top = `${next.y}px`;
    if (next.width !== undefined) modalDiv.style.width = `${next.width}px`;
    if (next.height !== undefined) modalDiv.style.height = `${next.height}px`;

    // Keep rect before expand
    if (useModalStore.getState().modals[name]?.isFull) return;
    useModalViewStore.getState().setRect(name, next);
  };

  useLayoutEffect(() => {
    const modalDiv = modalRef.current;
    if (!modalDiv || !modalState) return;

    // Outbound checking
    const modalContainer = document.getElementById("modals");

    const screenWidth = modalContainer?.offsetWidth as number;
    const screenHeight = modalContainer?.offsetHeight as number;

    if (modalState.isFull) {
      // Fix width, height with calculated scale
      if (!modalContainer) return;

      let properScale = 0;
      if (dive) {
        properScale = modalContainer.offsetWidth / 3200;
        if (properScale < 0.45) properScale = 0.45;
        if (properScale > 0.6) properScale = 0.6;
      } else {
        properScale = modalContainer.offsetHeight / 1800;
        if (properScale < 0.6) properScale = 0.6;
      }

      const newWidth = modalDiv.offsetWidth / properScale;
      const newHeight = modalDiv.offsetHeight / properScale;

      applyRect({ width: newWidth, height: newHeight });
    } else {
      // Position setting
      let newTop = parseInt(modalDiv.style.top);
      let newLeft = parseInt(modalDiv.style.left);

      const style = window.getComputedStyle(modalDiv);
      const modalScale = Number(style.scale == "none" ? 1 : style.scale);

      const minTop = 64; // Fix hardcoding
      const maxTop = screenHeight - 40;
      const minLeft = -modalDiv.offsetWidth * modalScale + 40;
      const maxLeft = screenWidth - 40;
      newTop = Math.max(minTop, newTop);
      newTop = Math.min(maxTop, newTop);
      newLeft = Math.max(minLeft, newLeft);
      newLeft = Math.min(maxLeft, newLeft);

      // Size setting
      let newWidth = modalDiv.offsetWidth;
      let newHeight = modalDiv.offsetHeight;

      const minWidth = 300;
      const maxWidth = (screenWidth * 0.9) / modalScale;
      const minHeight = 200;
      const maxHeight = (screenHeight * 0.9) / modalScale;

      newWidth = Math.max(minWidth, newWidth);
      newWidth = Math.min(newWidth, maxWidth);
      newHeight = Math.max(minHeight, newHeight);
      newHeight = Math.min(newHeight, maxHeight);

      applyRect({ x: newLeft, y: newTop, width: newWidth, height: newHeight });
    }
  }, [modalState.isFull, dive]);

  useEffect(() => {
    const modalDiv = modalRef.current;
    if (!modalDiv || !modalState) return;

    const resizeModalBoundary = () => {
      const modalContainer = document.getElementById("modals");
      if (!modalContainer) return;

      const offsetLeft = modalDiv.offsetLeft;
      const offsetTop = modalDiv.offsetTop;

      const screenWidth = modalContainer?.offsetWidth as number;
      const screenHeight = modalContainer?.offsetHeight as number;

      if (offsetLeft > screenWidth) applyRect({ x: screenWidth - 50 });
      if (offsetTop > screenHeight) applyRect({ y: screenHeight - 30 });
    };

    window.addEventListener("resize", resizeModalBoundary);
    const cleanup = () => {
      window.removeEventListener("resize", resizeModalBoundary);
    };

    // Init state, if isDown is false -> animating
    if (modalState.isDown) {
      modalDiv.style.transform = `scale(0)`;
      return cleanup;
    }

    // Folder center
    const folderDiv = document.getElementById(
      `folder-${name}`,
    ) as HTMLDivElement;

    if (!folderDiv) {
      throw new Error("There is no target folder");
    }

    moveFromTarget(folderDiv);

    return cleanup;
  }, []);

  useEffect(() => {
    if (!modalRef.current || !modalState) return;

    if (modalState.isDown) {
      const modalDockDiv = document.getElementById(
        `dock-${name}`,
      ) as HTMLDivElement;

      if (!modalDockDiv) {
        return;
      }

      moveToTarget(modalDockDiv);
    } else {
      const modalDockDiv = document.getElementById(
        `dock-${name}`,
      ) as HTMLDivElement;

      if (!modalDockDiv) {
        return;
      }

      moveFromTarget(modalDockDiv);
    }
  }, [modalState?.isDown]);

  useEffect(() => {
    if (!modalState) return;

    if (modalState.isClosing) {
      // Folder center
      const folderDiv = document.getElementById(
        `folder-${name}`,
      ) as HTMLDivElement;

      if (!folderDiv) {
        throw new Error("There is no target folder");
      }

      moveToTarget(folderDiv);
    }
  }, [modalState?.isClosing]);

  useEffect(() => {
    const modalDiv = modalRef.current;
    if (!modalDiv) return;

    modalDiv.style.zIndex = `${zIndex}`;
  }, [zIndex]);

  const moveFromTarget = (target: HTMLDivElement) => {
    const modalDiv = modalRef.current;
    if (!modalDiv) return;

    // Initialize transform style
    modalDiv.getAnimations().forEach((anim) => anim.cancel());

    modalDiv.style.transform = "none";
    void modalDiv.offsetHeight;

    const modalRect = modalDiv.getBoundingClientRect();

    // Calculate screen scale
    const scaleX = modalRect.width / modalDiv.offsetWidth;
    const scaleY = modalRect.height / modalDiv.offsetHeight;

    // Modal center
    const modalLeft = modalRect.x;
    const modalTop = modalRect.y;

    // Target center
    const targetRect = target.getBoundingClientRect();
    const targetCenterX = targetRect.x + targetRect.width / 2;
    const targetCenterY = targetRect.y + targetRect.height / 2;

    const translateX = (targetCenterX - modalLeft) / scaleX;
    const translateY = (targetCenterY - modalTop) / scaleY;

    modalDiv.animate(
      [
        {
          transform: `translate(${translateX}px, ${translateY}px) scale(0)`,
        },
        { transform: `translate(0, 0) scale(1) ` },
      ],
      { duration: 300, easing: "ease-in-out", fill: "forwards" },
    );
  };

  const moveToTarget = (target: HTMLDivElement) => {
    const modalDiv = modalRef.current;
    if (!modalDiv) return;

    // Initialize transform style
    modalDiv.getAnimations().forEach((anim) => anim.cancel());

    modalDiv.style.transform = "none";
    void modalDiv.offsetHeight;

    const modalRect = modalDiv.getBoundingClientRect();

    // Calculate screen scale
    let scaleX = modalRect.width / modalDiv.offsetWidth;
    let scaleY = modalRect.height / modalDiv.offsetHeight;

    // Modal center
    const modalLeft = modalRect.x;
    const modalTop = modalRect.y;

    // Target center
    const targetRect = target.getBoundingClientRect();
    const targetCenterX = targetRect.x + targetRect.width / 2;
    const targetCenterY = targetRect.y + targetRect.height / 2;

    const translateX = (targetCenterX - modalLeft) / scaleX;
    const translateY = (targetCenterY - modalTop) / scaleY;

    modalDiv.animate(
      [
        { transform: `translate(0, 0) scale(1)` },
        {
          transform: `translate(${translateX}px, ${translateY}px) scale(0)`,
        },
      ],
      { duration: 300, easing: "ease-in-out", fill: "forwards" },
    );
  };

  const panningHandler = (e: React.MouseEvent) => {
    const modalDiv = modalRef.current;
    const modalContainer = document.getElementById("modals");
    if (!modalContainer || !modalDiv) return;

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

      applyRect({ x: newLeft, y: newTop });
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

      const minWidth = 1000;
      const maxWidth = (screenWidth * 0.9) / modalScale;
      const minHeight = 500;
      const maxHeight = (screenHeight * 0.9) / modalScale;

      newWidth = Math.max(minWidth, newWidth);
      newWidth = Math.min(newWidth, maxWidth);
      newHeight = Math.max(minHeight, newHeight);
      newHeight = Math.min(newHeight, maxHeight);

      applyRect({ width: newWidth, height: newHeight });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const expandClick = () => {
    if (modalState.isFull) {
      collapseModal(name);
    } else {
      expandModal(name);
    }
  };

  return (
    <div
      style={style}
      ref={modalRef}
      className={cn(
        "@container w-250 h-150 bg-transparent rounded-lg overflow-hidden border border-gray-300 shadow-2xl shadow-[#00000052] pointer-events-auto relative",
        // "origin-top-left",
        dive
          ? "scale-[clamp(0.45,calc(100cqw/3200px),0.6)] origin-top-left"
          : "scale-[clamp(0.6,calc(100cqh/1800px),1)] origin-top-left",
        className,
      )}
      onMouseDown={() => bringToFront(name)}
    >
      <div
        className="absolute top-0 left-0 w-full h-23 bg-transparent cursor-move z-10"
        onMouseDown={panningHandler}
      ></div>

      {!modalState.isFull && (
        <div
          className="absolute bottom-0 right-0 size-9 cursor-nwse-resize bg-transparent z-10"
          onMouseDown={resizeHandler}
        >
          <ResizeIcon className="w-full h-full text-blue-600" />
        </div>
      )}

      <div className="absolute top-0 left-0 w-40 h-22 flex items-center justify-center z-15 pointer-events-none">
        <div className="flex gap-3 pointer-events-auto group">
          <div
            className="size-5 rounded-full bg-[rgb(255,95,87)] flex justify-center items-center"
            onClick={() => closeModalStart(name)}
          >
            <CloseIcon className="size-3 hidden group-hover:block" />
          </div>
          <div
            className="size-5 rounded-full bg-[rgb(255,188,46)] flex justify-center items-center"
            onClick={() => downupModal(name, true)}
          >
            <RemoveIcon className="size-3 hidden group-hover:block" />
          </div>
          <div
            className="size-5 rounded-full bg-[rgb(43,200,64)] flex justify-center items-center"
            onClick={expandClick}
          >
            {modalState.isFull ? (
              <CollapseIcon className="size-3 hidden group-hover:block" />
            ) : (
              <ExpandIcon className="size-3 hidden group-hover:block" />
            )}
          </div>
        </div>
      </div>

      <div className="flex w-full h-full">
        <div
          className={cn(
            "flex flex-col w-75 shrink-0 bg-[#d6d6d6]/80 backdrop-blur-2xl border-r-2 border-[#cecece] transition-all duration-200 ease-out",
            // navActive ? "hidden @4xl:block" : "hidden",
            navActive ? "block" : "hidden",
          )}
        >
          <NavContent name={name} />
        </div>
        <div className="flex flex-col flex-1 overflow-hidden bg-white">
          <div
            className={cn(
              "h-23 bg-[#f0f0f0] text-[#525252] flex items-center py-3 border-b border-[#e5e5e5] translate-y-px",
              // navActive ? "px-38 @4xl:px-8" : "px-38",
              navActive ? "px-8" : "px-38",
            )}
          >
            <span className="text-[1.6rem] font-semibold">{name}</span>
          </div>
          <MDContent name={name} />
        </div>
      </div>
    </div>
  );
}
