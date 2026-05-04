import "./App.css";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router";
import { useDemoViewerViewModel } from "./modules/demo-viewer/viewmodel/DemoViewerViewModel.tsx";
import { Layout } from "antd";
import { AuthProvider } from "./modules/auth";
import { AppHeader } from "./components/AppHeader";
import { lazy } from "react";

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

const DemoPlayerPage = lazy(() => import("./pages/demo-player"));
const SettingsPage = lazy(() => import("./pages/settings"));

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <div className="w-screen h-screen">Main</div>,
      },
      {
        path: "/player/:matchId",
        loader: useDemoViewerViewModel.matchManifestLoader,
        element: <DemoPlayerPage />,
      },
      {
        path: "/settings",
        element: <SettingsPage />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
