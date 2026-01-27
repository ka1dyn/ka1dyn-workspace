import { useEffect, useRef, useState } from "react";
import InfoModal from "./InfoModal";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

export default function Folder({
  name,
  initModalX,
  initModalY,
}: {
  name: string;
  initModalX: number;
  initModalY: number;
}) {
  const folderRef = useRef<HTMLDivElement>(null!);
  const modalRef = useRef<HTMLDivElement>(null!);
  const [active, setActive] = useState<boolean>(false);

  const folderClick = () => {
    setActive(true);
  };

  useEffect(() => {
    if (active) {
      const modalDiv = modalRef.current;
      const modalRect = modalDiv.getBoundingClientRect();

      // Calculate screen scale
      const scaleX = modalRect.width / modalDiv.offsetWidth;
      const scaleY = modalRect.height / modalDiv.offsetHeight;

      // modal center
      const modalLeft = modalRect.x;
      const modalTop = modalRect.y;

      // Calculate transform

      // Center of about me folder
      const folderDiv = folderRef.current;
      const folderRect = folderDiv.getBoundingClientRect();
      const folderCenterX = folderRect.x + folderRect.width / 2;
      const folderCenterY = folderRect.y + folderRect.height / 2;

      const tranlateX = (folderCenterX - modalLeft) / scaleX;
      const translateY = (folderCenterY - modalTop) / scaleY;

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

  const modalsDiv = document.getElementById("modals");

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
            name={name}
            style={{
              top: `${initModalY}px`,
              left: `${initModalX}px`,
            }}
            className={cn("absolute", !active && "hidden")}
            modalRef={modalRef}
            active={active}
            setActive={setActive}
            navActive={true}
          />,
          modalsDiv,
        )}
    </div>
  );
}
