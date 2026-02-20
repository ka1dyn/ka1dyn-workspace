import { useModalStore } from "@/stores";
import Card from "./Card";

export default function ProjectContentHome({ name }: { name: string }) {
  const setContentPath = useModalStore((state) => state.setContentPath);

  return (
    <div className="w-full text-2xl">
      <h1 className="text-5xl mb-10">Web project</h1>
      <div className="flex gap-8 flex-wrap">
        <Card
          name="Ka1dyn-Workspace"
          onClick={() => setContentPath(name, "/content/test.md")}
        >
          <div className="flex flex-col gap-4">
            <span className="text-muted-foreground">
              React Three Fiber 기반 full-3d 웹 포트폴리오
            </span>
            <div className="absolute bottom-5 left-4">
              <div className="flex gap-2 flex-wrap">
                <img
                  src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"
                  className="w-25"
                ></img>
              </div>
            </div>
          </div>
        </Card>
        <Card
          name="Ka1dyn-devlog"
          onClick={() => setContentPath(name, "/content/test1.md")}
        >
          <div className="flex flex-col gap-4">
            <span className="text-muted-foreground">
              로컬 Obsidian 노트 자동화 개발 블로그
            </span>
            <div className="absolute bottom-5 left-4">
              <div className="flex gap-2 flex-wrap">
                <img
                  src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"
                  className="w-25"
                ></img>
              </div>
            </div>
          </div>
        </Card>
        <Card
          name="Ecode"
          onClick={() => setContentPath(name, "/content/test2.md")}
        ></Card>
      </div>
      {/* <div className="bg-amber-400">홈입니다</div> */}
    </div>
  );
}
