import { cn } from "@/lib/utils";
import { useModalStore } from "@/stores";
import React from "react";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";

export default function ModalDockItem({ name }: { name: string }) {
  const [render, setRender] = useState<boolean>(false);
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const { modalState, downModal } = useModalStore(
    useShallow((state) => ({
      modalState: state.modals[name],
      downModal: state.downModal,
    })),
  );

  useEffect(() => {
    if (modalState.isOpen) {
      setIsOpening(true);
      setRender(true);

      const timer = setTimeout(() => {
        setIsOpening(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      // Animation start before unmount
      setIsClosing(true);

      // Unmount component
      const timer = setTimeout(() => {
        setIsClosing(false);
        setRender(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [modalState.isOpen]);

  if (!render) return null;

  return (
    <React.Fragment>
      <div
        id={`dock-${modalState.name}`}
        className="relative flex items-center h-full"
      >
        <div
          className={cn(
            "flex justify-center items-center cursor-pointer size-16 rounded-xl bg-amber-50 hover:shadow-lg/50 shadow-white transition-all duration-300 ease-in-out",
            isOpening && "animate-dock-add",
            isClosing && "animate-dock-remove",
          )}
          onClick={() => downModal(modalState.name, !modalState.isDown)}
        >
          <span className="break-all text-center lg:text-[16px]">
            {modalState.name}
          </span>
        </div>
        {!modalState.isDown && (
          <div
            className={`absolute bottom-0 left-8 size-1.25 rounded-full bg-white`}
            style={{
              transform: `translateX(-50%))`,
            }}
          ></div>
        )}
      </div>
    </React.Fragment>
  );
}
