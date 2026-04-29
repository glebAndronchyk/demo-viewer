import "./App.css";
import DemoViewer from "./modules/demo-viewer/components/DemoViewer.tsx";
import { createBrowserRouter, RouterProvider } from "react-router";
import { useDemoViewerViewModel } from "./modules/demo-viewer/viewmodel/DemoViewerViewModel.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    loader: useDemoViewerViewModel.matchManifestLoader,
    element: (
      <div className="w-screen h-screen">
        <DemoViewer />
      </div>
    ),
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
