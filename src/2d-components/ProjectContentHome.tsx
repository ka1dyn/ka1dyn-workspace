import { useModalStore } from "@/stores";
import Card from "./Card";
import { PUBLIC_IMAGES } from "@/constants/images";

export default function ProjectContentHome({ name }: { name: string }) {
  const setContentPath = useModalStore((state) => state.setContentPath);

  return (
    <div className="w-full text-2xl">
      <h1 className="text-5xl mb-10">Web project</h1>
      <div className="flex gap-8 flex-wrap">
        <Card
          name="Ka1dyn-Workspace"
          onClick={() => setContentPath(name, "/content/project_workspace.md")}
          thumbnail={PUBLIC_IMAGES.PROJECT_WORKSPACE_THUMBNAIL}
          pCnt={1}
        >
          <div className="flex flex-col gap-4">
            <span className="text-muted-foreground">
              개인 개발 공간을 모티브로 한 Full 3D 인터랙티브 웹 포트폴리오
            </span>
          </div>
        </Card>
        <Card
          name="Ecode"
          onClick={() => setContentPath(name, "/content/project_ecode.md")}
          thumbnail={PUBLIC_IMAGES.PROJECT_ECODE_THUMBNAIL}
          pCnt={6}
        >
          <div className="flex flex-col gap-4">
            <span className="text-muted-foreground">
              JAVA 코드 탄소배출량 측정
            </span>
          </div>
        </Card>
        <Card
          name="Ka1dyn-devlog"
          onClick={() => setContentPath(name, "/content/test1.md")}
          thumbnail={PUBLIC_IMAGES.PROJECT_DEVLIBRARY_THUMBNAIL}
          pCnt={1}
        >
          <div className="flex flex-col gap-4">
            <span className="text-muted-foreground">
              Obsidian 노트 기반 자동화 개발 블로그
            </span>
          </div>
        </Card>
      </div>
      {/* <div className="bg-amber-400">홈입니다</div> */}
    </div>
  );
}
