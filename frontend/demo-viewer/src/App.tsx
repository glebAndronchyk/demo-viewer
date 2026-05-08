import "./App.css";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router";
import { useDemoViewerViewModel } from "./modules/demo-viewer/viewmodel/DemoViewerViewModel.tsx";
import { Layout } from "antd";
import { AuthProvider } from "./modules/auth";
import { AppHeader } from "./components/AppHeader";
import { lazy } from "react";
import { AccountPage } from "./pages/account/AccountPage.tsx";
import RootPage from "./pages/root/RootPage.tsx";
import { useRootPageViewModel } from "./pages/root/viewmodel/RootPageViewModel.tsx";

const RootLayout = () => (
  <AuthProvider>
    <Layout style={{ minHeight: "100vh" }}>
      <AppHeader />
      <Layout.Content className="pt-16 !min-h-screen !h-screen">
        <Outlet />
      </Layout.Content>
    </Layout>
  </AuthProvider>
);

const DemoPlayerPage = lazy(() => import("./pages/demo-player"));

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        loader: useRootPageViewModel.loader,
        element: <RootPage />,
      },
      {
        path: "/player/:matchId",
        loader: useDemoViewerViewModel.matchManifestLoader,
        element: <DemoPlayerPage />,
      },
      {
        path: "account",
        element: <AccountPage />,
        children: [
          { index: true, element: <Navigate to="statistics" replace /> },
          {
            path: "statistics",
            element: <AccountPage.StatisticsPage />,
          },
          {
            path: "sharing-settings",
            element: <AccountPage.SettingsPage />,
          },
        ],
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
