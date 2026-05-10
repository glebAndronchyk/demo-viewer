import "./App.css";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router";
import { useDemoViewerViewModel } from "./modules/demo-viewer/viewmodel/DemoViewerViewModel.tsx";
import { Layout } from "antd";
import { AppHeader } from "./components/AppHeader";
import { lazy } from "react";
import { AccountPage } from "./pages/account/AccountPage.tsx";
import RootPage from "./pages/root/RootPage.tsx";
import { useRootPageViewModel } from "./pages/root/viewmodel/RootPageViewModel.tsx";
import StatisticsPage from "./pages/account/pages/StatisticsPage.tsx";
import { type AuthUser, useAuth } from "./modules/auth";

const RootLayout = () => (
  <Layout style={{ minHeight: "100vh" }}>
    <AppHeader />
    <Layout.Content className="pt-16 !min-h-screen !h-screen">
      <Outlet />
    </Layout.Content>
  </Layout>
);

const DemoPlayerPage = lazy(() => import("./pages/demo-player"));

const router = (user: AuthUser | null) =>
  createBrowserRouter([
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
            {
              index: true,
              element: <Navigate to="statistics/weapons" replace />,
            },
            {
              path: "statistics",
              element: <AccountPage.StatisticsPage />,
              children: [
                {
                  loader: StatisticsPage.Weapons.loader(user),
                  path: "weapons",
                  element: <AccountPage.StatisticsPage.Weapons />,
                },
                {
                  loader: StatisticsPage.Economics.loader(user),
                  path: "economics",
                  element: <AccountPage.StatisticsPage.Economics />,
                },
                {
                  path: "performance",
                  loader: StatisticsPage.Performance.loader(user),
                  element: <AccountPage.StatisticsPage.Performance />,
                },
              ],
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
  const { user } = useAuth();

  return <RouterProvider router={router(user)} />;
}

export default App;
