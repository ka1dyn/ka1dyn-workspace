import { useEffect, useState } from "react";
import Markdown from "react-markdown";

export default function MDViewer({ path }: { path: string }) {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    console.log(path);
    fetch(path)
      .then((res) => res.text())
      .then((text) => setContent(text));
  }, []);

  return (
    <div className="prose w-full h-full">
      <Markdown>{content}</Markdown>
    </div>
  );
}
