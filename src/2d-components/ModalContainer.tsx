import { cn } from "@/lib/utils";
import { useModalStore } from "@/stores";
import InfoModal from "./InfoModal";
import { useShallow } from "zustand/shallow";
import React from "react";

export default function ModalContainer({
  className = "",
}: {
  className?: string;
}) {
  const { modals } = useModalStore(
    useShallow((state) => ({
      modals: state.modals,
    })),
  );

  return (
    <div id="modals" className={cn("w-50 h-50 pointer-events-none", className)}>
      {Object.values(modals).map((modal) => {
        const maxLeft = window.innerWidth - 50;
        const maxTop = window.innerHeight - 30;

        const navActive = modal.name == "projects";

        return (
          <React.Fragment key={modal.name}>
            <InfoModal
              name={modal.name}
              style={{
                top: modal.isFull ? "64px" : Math.min(modal.y, maxTop),
                left: modal.isFull ? "0px" : Math.min(modal.x, maxLeft),
                width: modal.isFull ? "100%" : modal.width,
                height: modal.isFull ? "calc(100% - 64px)" : modal.height,
                zIndex: modal.zIndex,
              }}
              className={cn("absolute")}
              navActive={navActive}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}
