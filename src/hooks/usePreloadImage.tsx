import { preloadImage } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export default function usePreloadImage(imagePaths: string[]) {
  const [isReady, setIsReady] = useState<boolean>(false);
  const lastPathsRef = useRef<string[]>([]);

  useEffect(() => {
    // If imagePaths are same, block load images
    const isSame =
      lastPathsRef.current.length === imagePaths.length &&
      lastPathsRef.current.every((path, i) => path === imagePaths[i]);

    if (isSame) return;

    lastPathsRef.current = imagePaths;

    if (imagePaths.length === 0) {
      setIsReady(true);
      return;
    }

    let isMounted = true;

    const loadAllImages = async () => {
      setIsReady(false);

      try {
        await Promise.all(imagePaths.map((path) => preloadImage(path)));

        if (isMounted) {
          setIsReady(true);
          console.log("Complete all image preload");
        }
      } catch (error) {
        console.error("Error during image preload", error);
      }
    };

    loadAllImages();

    return () => {
      isMounted = false;
    };
  }, [imagePaths]);

  return {
    isReady,
  };
}
