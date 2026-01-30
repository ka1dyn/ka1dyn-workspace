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
      {Object.values(modals).map((modal) => (
        <React.Fragment key={modal.name}>
          <InfoModal
            name={modal.name}
            style={{ top: modal.y, left: modal.x }}
            className={cn("absolute")}
          />
        </React.Fragment>
      ))}
    </div>
  );
}
