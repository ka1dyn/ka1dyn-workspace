import Scene from "@/3d-components/Scene";
import { useFullscreen, useStart } from "./stores";
import Loading from "./2d-components/Loading";
import { Route } from "wouter";
import Booting from "./2d-components/Booting";
import Overlay from "./2d-components/Overlay";
import { useEffect } from "react";
import Home from "./2d-components/Home";

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
      <div className="w-screen h-screen bg-[#010203]">
        <Route path="/test" component={Home} />
        <Route path="/">
          {/* <Scene /> */}
          <>
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
