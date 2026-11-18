import { cn } from "@/lib/utils";
import { useModalStore } from "@/stores";

export default function NavItem({
  name,
  children,
  content,
}: {
  name: string;
  content: string;
  children: React.ReactNode;
}) {
  const setContentPath = useModalStore((state) => state.setContentPath);
  const contentPath = useModalStore((state) => state.modals[name].contentPath);

  return (
    <div
      onClick={() => setContentPath(name, content)}
      className={cn(
        "flex items-center gap-2 py-2 px-3 rounded-xl cursor-pointer",
        contentPath === content && "bg-muted-foreground/30",
      )}
    >
      {children}
    </div>
  );
}
