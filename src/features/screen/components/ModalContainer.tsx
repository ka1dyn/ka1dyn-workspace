import { cn } from "@/shared/utils";
import { useModalStore } from "../stores";
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
        const navActive = modal.name == "projects";

        return (
          <React.Fragment key={modal.name}>
            <InfoModal
              name={modal.name}
              className={cn("absolute")}
              navActive={navActive}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}
