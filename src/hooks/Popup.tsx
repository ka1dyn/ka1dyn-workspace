import { useEffect, useRef, useState } from "react";

export default function usePopup() {
  const [active, setActive] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mouseClick = (event: MouseEvent) => {
      if (
        containerRef &&
        !containerRef.current?.contains(event.target as Node)
      ) {
        setActive(false);
      }
    };

    document.addEventListener("mousedown", mouseClick);

    return () => {
      document.removeEventListener("mousedown", mouseClick);
    };
  }, [containerRef]);

  return { active, setActive, containerRef };
}
