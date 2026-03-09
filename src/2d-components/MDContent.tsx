import { cn } from "@/lib/utils";
import ProjectContentHome from "./ProjectContentHome";
import MDViewer from "./MDViewer";
import { useModalStore } from "@/stores";
import { useEffect, useRef } from "react";

export default function MDContent({ name }: { name: string }) {
  const modalState = useModalStore((state) => state.modals[name]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef) return;

    scrollRef.current?.scrollTo({
      top: 0,
    });
  }, [modalState.contentPath]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "bg-white h-full overflow-y-auto flex flex-col items-center px-15 py-10",
      )}
    >
      {modalState.contentPath === "/home" ? (
        <ProjectContentHome name={name} />
      ) : (
        <MDViewer path={modalState.contentPath} />
      )}
    </div>
  );
}
