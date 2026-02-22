import { preloadImage } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function usePreloadImage(imagePaths: string[]) {
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
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
