import { useEffect, useRef, useState } from "react";
import InfoModal from "./InfoModal";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { useModalStack } from "@/stores";

export default function Folder({ name }: { name: string }) {
  const folderRef = useRef<HTMLDivElement>(null!);
  const modalRef = useRef<HTMLDivElement>(null!);
  const [active, setActive] = useState<boolean>(false);
  const getNextStack = useModalStack((state) => state.getNextStack);

  const bringToFront = () => {
    if (modalRef.current) {
      modalRef.current.style.zIndex = getNextStack().toString();
    }
  };

  const folderClick = () => {
    bringToFront();
    setActive(true);
  };

  useEffect(() => {
    if (active) {
      const modalDiv = modalRef.current;
      const modalRect = modalDiv.getBoundingClientRect();
      // modal center
      const modalCenterX = modalRect.x + modalRect.width / 2;
      const modalCenterY = modalRect.y + modalRect.height / 2;

      // Calculate transform

      // Center of about me folder
      const folderDiv = folderRef.current;
      const folderRect = folderDiv.getBoundingClientRect();
      const folderCenterX = folderRect.x + folderRect.width / 2;
      const folderCenterY = folderRect.y + folderRect.height / 2;

      const tranlateX = folderCenterX - modalCenterX;
      const translateY = folderCenterY - modalCenterY;

      modalDiv.animate(
        [
          {
            transform: `translate(${tranlateX}px, ${translateY}px) scale(0)`,
          },
          { transform: `translate(0, 0) scale(1) ` },
        ],
        { duration: 300, easing: "ease-in-out" },
      );
    }
  }, [active]);

  const modalsDiv = document.querySelector(".modals");

  return (
    <div className="flex justify-center items-center">
      <button
        className={`flex flex-col items-center group cursor-pointer`}
        onDoubleClick={folderClick}
      >
        <div className="flex flex-col gap-1 items-center">
          <div
            ref={folderRef}
            className="flex justify-center items-center w-25 h-23 border-gray-400/70
            group-focus:bg-black/20 group-focus:border-2"
          >
            <img
              src="/images/folder.png"
              className="w-20 h-auto pointer-events-none"
            ></img>
          </div>

          {/* Div for background wrap */}
          <div>
            <span className="break-all text-center lg:text-[18px] leading-none text-white group-focus:bg-blue-600">
              {name}
            </span>
          </div>
        </div>
      </button>
      {modalsDiv &&
        createPortal(
          <InfoModal
            className={cn("absolute top-40 left-30", !active && "hidden")}
            modalRef={modalRef}
          />,
          modalsDiv,
        )}
    </div>
  );
}
