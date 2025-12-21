import Scene from "@/3d-components/Rain/Scene"
import { useStart } from "./stores"
import Loading from "./2d-components/Loading"

function App() {
  const start = useStart((state) => state.start)

  return (
    // start ? <Scene /> : <Loading />
    <Scene />
  )
}

export default App
