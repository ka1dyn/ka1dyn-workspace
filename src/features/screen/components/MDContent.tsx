import { cn } from "@/shared/utils";
import ProjectContentHome from "./ProjectContentHome";
import MDViewer from "./MDViewer";
import { useModalStore, useModalViewStore } from "@/shared/stores";
import { useEffect, useLayoutEffect, useRef } from "react";

export default function MDContent({ name }: { name: string }) {
  const contentPath = useModalStore((state) => state.modals[name].contentPath);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Save scroll in ref, commit on unmount
  // (drei Html removes DOM first -> scrollTop is 0 in cleanup)
  const lastScroll = useRef(0);

  const restoreScroll = () => {
    lastScroll.current = useModalViewStore.getState().scrolls[name] ?? 0;
    scrollRef.current?.scrollTo({ top: lastScroll.current });
  };

  // Markdown -> restore in onReady (after fetch)
  useLayoutEffect(() => {
    if (contentPath === "/home") restoreScroll();
    else lastScroll.current = useModalViewStore.getState().scrolls[name] ?? 0;
  }, [contentPath]);

  useEffect(() => {
    return () => {
      // Closed modal -> no save
      if (!useModalStore.getState().modals[name]) return;
      useModalViewStore.getState().setScroll(name, lastScroll.current);
    };
  }, [name]);

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => {
        lastScroll.current = e.currentTarget.scrollTop;
      }}
      className={cn(
        "bg-white h-full overflow-y-auto flex flex-col items-center px-15 py-10",
      )}
    >
      {contentPath === "/home" ? (
        <ProjectContentHome name={name} />
      ) : (
        <MDViewer path={contentPath} onReady={restoreScroll} />
      )}
    </div>
  );
}
