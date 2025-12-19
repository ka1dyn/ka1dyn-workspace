import Scene from "@/3d-components/Rain/Scene"
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import Home from "./screen-components/home";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Scene />,
  },
  {
    path: 'home',
    element: <Home />
  }
]);

function App() {
  return (
    <RouterProvider router={router} />
  )
}

export default App
