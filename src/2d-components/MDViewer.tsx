import { useEffect, useState, type RefObject } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";

export default function MDViewer({ path }: { path: string }) {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    fetch(path)
      .then((res) => res.text())
      .then((text) => setContent(text));
  }, [path]);

  return (
    <div className="pt-10 pb-50 prose prose-blockquote:not-italic text-[28px] leading-relaxed">
      <Markdown rehypePlugins={[rehypeRaw]}>{content}</Markdown>
    </div>
  );
}
