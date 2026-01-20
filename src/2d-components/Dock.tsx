import { cn } from "@/lib/utils";

export default function Dock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex p-3 gap-8 justify-center items-center bg-gray-500/50 backdrop-blur-sm min-w-75 h-24 rounded-t-2xl w-fit",
        className,
      )}
    >
      <div className="size-16 bg-amber-100 rounded-xl"></div>
      <div className="size-16 bg-amber-100 rounded-xl"></div>
      <div className="size-16 bg-amber-100 rounded-xl"></div>
    </div>
  );
}
