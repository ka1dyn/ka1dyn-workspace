import { useEffect, useState } from "react";
import Markdown from "react-markdown";

export default function MDViewer({ path }: { path: string }) {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    fetch(path)
      .then((res) => res.text())
      .then((text) => setContent(text));
  }, [path]);

  return (
    <div className="prose text-[28px] leading-relaxed">
      <Markdown>{content}</Markdown>
    </div>
  );
}
