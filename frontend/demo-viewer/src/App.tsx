import "./App.css";
import DemoViewer from "./modules/demo-viewer/components/DemoViewer.tsx";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router";
import { useDemoViewerViewModel } from "./modules/demo-viewer/viewmodel/DemoViewerViewModel.tsx";
import { Layout } from "antd";
import { AuthProvider } from "./modules/auth";
import { AppHeader } from "./components/AppHeader";

const RootLayout = () => (
  <AuthProvider>
    <Layout style={{ minHeight: "100vh" }}>
      <AppHeader />
      <Layout.Content>
        <Outlet />
      </Layout.Content>
    </Layout>
  </AuthProvider>
);

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        loader: useDemoViewerViewModel.matchManifestLoader,
        element: (
          <div className="w-screen h-screen">
            <DemoViewer />
          </div>
        ),
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
