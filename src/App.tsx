import Scene from "@/3d-components/Scene";
import { useFullscreen, useStart } from "./stores";
import Loading from "./2d-components/Loading";
import { Route } from "wouter";
import Overlay from "./2d-components/Overlay";
import { lazy, Suspense, useEffect } from "react";
import Home from "./2d-components/Home";
import { IS_LAB } from "./lab/store";

// 실험실 패널(leva)은 ?lab일 때만 내려받는다
const LabPanel = lazy(() => import("./lab/LabPanel"));

function App() {
  const start = useStart((state) => state.start);
  const setFullscreen = useFullscreen((state) => state.setFullscreen);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setFullscreen(isNowFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <>
      {/* Set bg color For occlude blending option on screen */}
      <div className="w-screen h-screen bg-[#010203] font-roboto">
        <Route path="/">
          {/* <Scene /> */}
          <>
            {IS_LAB && (
              <Suspense fallback={null}>
                <LabPanel />
              </Suspense>
            )}
            <Overlay />
            <Scene />
            {!start && <Loading />}
          </>
        </Route>
      </div>
    </>
  );
}

export default App;
