import Scene from "@/3d-components/Rain/Scene"
import { useStart } from "./stores"
import Loading from "./2d-components/Loading"
import { Route } from "wouter"
import Booting from "./2d-components/Booting"

function App() {
  const start = useStart((state) => state.start)

  return (
    <>
    <div className="w-screen h-screen bg-[#010203]">
      <Route path="/test" component={Booting} />
      <Route path="/">
          <Scene />
        {/* {start ? <Scene /> : <Loading />} */}
      </Route>
      </div>
    </>
    
  )
}

export default App
