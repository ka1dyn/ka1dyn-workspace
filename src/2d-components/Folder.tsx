import { useModalStore } from "@/stores";
import { useRef } from "react";
import { useShallow } from "zustand/shallow";

export default function Folder({
  id,
  name,
  initModalX,
  initModalY,
}: {
  id: string;
  name: string;
  initModalX: number;
  initModalY: number;
}) {
  const folderRef = useRef<HTMLDivElement>(null!);
  const { modalState, openModal, bringToFront } = useModalStore(
    useShallow((state) => ({
      ...state,
      modalState: state.modals[name],
    })),
  );

  const folderClick = () => {
    if (modalState?.isClosing) return;
    openModal(name, initModalX, initModalY);
    bringToFront(name);
  };

  return (
    <div id={id} className="flex justify-center items-center">
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
    </div>
  );
}
