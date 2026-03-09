import { Book, Home, Sprout, Umbrella } from "lucide-react";
import { useMemo } from "react";
import NavItem from "./NavItem";

interface NavContentProps {
  name: string;
}

function ProjectNavContent({ name }: { name: string }) {
  return (
    <div className="flex flex-col gap-7 text-2xl p-3">
      <NavItem name={name} content={"/home"}>
        <Home className="text-blue-500" />
        Home
      </NavItem>

      <div className="flex flex-col gap-3">
        <h2 className="pl-3 text-muted-foreground">Web projects</h2>
        <div className="flex flex-col gap-2">
          <NavItem name={name} content={"/content/project_workspace.md"}>
            <Umbrella className="text-blue-500" />
            Ka1dyn-workspace
          </NavItem>
          <NavItem name={name} content={"/content/project_ecode.md"}>
            <Sprout className="text-blue-500" />
            Ecode
          </NavItem>
          <NavItem name={name} content={"/content/project_devlibrary.md"}>
            <Book className="text-blue-500" />
            Ka1dyn-devlog
          </NavItem>
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
