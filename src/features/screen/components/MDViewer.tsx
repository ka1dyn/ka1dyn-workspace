import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";

export default function MDViewer({
  path,
  onReady,
}: {
  path: string;
  onReady?: () => void;
}) {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    fetch(path)
      .then((res) => res.text())
      .then((text) => setContent(text));
  }, [path]);

  // Content render finish
  useEffect(() => {
    if (content) onReady?.();
  }, [content]);

  return (
    <div className="pt-10 pb-50 prose prose-blockquote:not-italic text-[28px] leading-relaxed">
      <Markdown rehypePlugins={[rehypeRaw]}>{content}</Markdown>
    </div>
  );
}
