import { useModalStore } from "@/stores";
import { useMemo } from "react";

interface NavContentProps {
  name: string;
}

function ProjectNavContent({ name }: { name: string }) {
  const setContentPath = useModalStore((state) => state.setContentPath);

  return (
    <div className="flex flex-col text-2xl">
      <div
        onClick={() => setContentPath(name, "/home")}
        className="hover:underline"
      >
        Home
      </div>

      <div className="flex flex-col gap-3">
        <h2>Web projects</h2>
        <div className="flex flex-col gap-2">
          <div
            onClick={() => setContentPath(name, "/content/test.md")}
            className="hover:underline"
          >
            Ka1dyn-workspace
          </div>
          <div
            onClick={() => setContentPath(name, "/content/test1.md")}
            className="hover:underline"
          >
            Ka1dyn-devlog
          </div>
          <div
            onClick={() => setContentPath(name, "/content/test2.md")}
            className="hover:underline"
          >
            Ecode
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NavContent({ name }: NavContentProps) {
  const renderNavContent = useMemo(() => {
    switch (name) {
      case "projects":
        return <ProjectNavContent name={name} />;
      default:
        return null;
    }
  }, [name]);

  return <div className="mt-20">{renderNavContent}</div>;
}
