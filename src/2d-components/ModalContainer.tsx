import { cn } from "@/lib/utils";
import { useModalStore } from "@/stores";
import InfoModal from "./InfoModal";

export default function ModalContainer({
  className = "",
}: {
  className?: string;
}) {
  const modals = useModalStore((state) => state.modals);

  return (
    <div id="modals" className={cn("w-50 h-50 pointer-events-none", className)}>
      {Object.values(modals).map(
        (modal) =>
          modal.isOpen && (
            <InfoModal
              key={modal.name}
              name={modal.name}
              style={{ top: modal.y, left: modal.x }}
              className={cn("absolute")}
            />
          ),
      )}
    </div>
  );
}
