import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import ResizeIcon from "@/icons/resize.svg?react";
import CloseIcon from "@/icons/close.svg?react";
import RemoveIcon from "@/icons/remove.svg?react";
import ExpandIcon from "@/icons/expand.svg?react";
import CollapseIcon from "@/icons/collapse.svg?react";
import { useModalStore, useTweaks } from "@/stores";
import MDViewer from "./MDViewer";
import { useShallow } from "zustand/shallow";
import NavContent from "./NavContent";
import ProjectContentHome from "./ProjectContentHome";

interface InfoModalProps {
  className?: string;
  name: string;
  style: Object;
  navActive?: boolean;
}

export default function InfoModal({
  className = "",
  name,
  style,
  navActive = true,
}: InfoModalProps) {
  const {
    zIndex,
    modalState,
    bringToFront,
    closeModalStart,
    downupModal,
    expandModal,
    collapseModal,
    saveModalState,
    registerBackup,
  } = useModalStore(
    useShallow((state) => ({
      ...state,
      zIndex: state.modals[name].zIndex,
      modalState: state.modals[name],
    })),
  );
  const modalRef = useRef<HTMLDivElement>(null!);
  const dive = useTweaks((state) => state.dive);

  useEffect(() => {
    const modalDiv = modalRef.current;
    if (!modalDiv || !modalState) return;

    const backupModal = async () => {
      const curModalState = useModalStore.getState().modals[name];

      await saveModalState(name, {
        ...curModalState,
        ...(!curModalState.isFull && {
          x: parseFloat(modalDiv.style.left) || modalDiv.offsetLeft,
          y: parseFloat(modalDiv.style.top) || modalDiv.offsetTop,
          width: modalDiv.offsetWidth,
          height: modalDiv.offsetHeight,
        }),

        zIndex: parseInt(modalDiv.style.zIndex),
      });
    };

    registerBackup(name, backupModal);

    const resizeModalBoundary = () => {
      const modalContainer = document.getElementById("modals");
      if (!modalContainer) return;

      const offsetLeft = modalDiv.offsetLeft;
      const offsetTop = modalDiv.offsetTop;

      const screenWidth = modalContainer?.offsetWidth as number;
      const screenHeight = modalContainer?.offsetHeight as number;

      if (offsetLeft > screenWidth)
        modalDiv.style.left = `${screenWidth - 50}px`;
      if (offsetTop > screenHeight)
        modalDiv.style.top = `${screenHeight - 30}px`;
    };

    window.addEventListener("resize", resizeModalBoundary);

    // Init state, if isDown is false -> animating
    if (modalState.isDown) {
      modalDiv.style.transform = `scale(0)`;
      return;
    }

    // Folder center
    const folderDiv = document.getElementById(
      `folder-${name}`,
    ) as HTMLDivElement;

    if (!folderDiv) {
      throw new Error("There is no target folder");
    }

    moveFromTarget(folderDiv);

    return () => {
      window.removeEventListener("resize", resizeModalBoundary);
    };
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

  const expandClick = () => {
    const modalDiv = modalRef.current;
    if (!modalDiv || !modalState) return;

    const { isFull } = modalState;

    if (isFull) {
      collapseModal(name);
    } else {
      expandModal(name, {
        x: parseFloat(modalDiv.style.left) || modalDiv.offsetLeft,
        y: parseFloat(modalDiv.style.top) || modalDiv.offsetTop,
        width: modalDiv.offsetWidth,
        height: modalDiv.offsetHeight,
      });
    }
  };

  return (
    <div
      style={style}
      ref={modalRef}
      className={cn(
        "@container w-250 h-150 bg-transparent rounded-lg overflow-hidden border border-gray-300 shadow-2xl shadow-[#00000052] pointer-events-auto relative",
        // "origin-top-left",
        !modalState.isFull &&
          (dive
            ? "scale-[clamp(0.45,calc(100cqw/3200px),0.6)] origin-top-left"
            : "scale-[clamp(0.6,calc(100cqh/1800px),1)] origin-top-left"),

        className,
      )}
      onMouseDown={() => bringToFront(name)}
    >
      <div
        className="absolute top-0 left-0 w-full h-18 bg-transparent cursor-move z-10"
        onMouseDown={panningHandler}
      ></div>

      <div
        className="absolute bottom-0 right-0 size-7 cursor-nwse-resize bg-transparent z-10"
        onMouseDown={resizeHandler}
      >
        <ResizeIcon className="w-full h-full text-gray-400" />
      </div>

      <div className="absolute top-0 left-0 w-30 h-18 flex items-center justify-center z-15 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto group">
          <div
            className="size-4.5 rounded-full bg-[rgb(255,95,87)] flex justify-center items-center"
            onClick={() => closeModalStart(name)}
          >
            <CloseIcon className="size-3 hidden group-hover:block" />
          </div>
          <div
            className="size-4.5 rounded-full bg-[rgb(255,188,46)] flex justify-center items-center"
            onClick={() => downupModal(name, true)}
          >
            <RemoveIcon className="size-3 hidden group-hover:block" />
          </div>
          <div
            className="size-4.5 rounded-full bg-[rgb(43,200,64)] flex justify-center items-center"
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
            "flex flex-col w-60 shrink-0 bg-[#d6d6d6]/80 backdrop-blur-2xl border-r-2 border-[#cecece] transition-all duration-200 ease-out",
            navActive ? "hidden @4xl:block" : "hidden",
          )}
        >
          <NavContent name={name} />
        </div>
        <div className="flex flex-col flex-1 z-5">
          <div
            className={cn(
              "h-18 bg-[#f0f0f0] text-[#525252] flex items-center py-3 border-b border-[#e5e5e5] translate-y-px",
              navActive ? "px-30 @4xl:px-8" : "px-30",
            )}
          >
            <span className="text-2xl font-semibold">{name}</span>
          </div>
          <div className="bg-white w-full h-full overflow-auto flex flex-col items-center px-15 py-10">
            {modalState.contentPath === "/home" ? (
              <ProjectContentHome />
            ) : (
              <MDViewer path={modalState.contentPath} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
