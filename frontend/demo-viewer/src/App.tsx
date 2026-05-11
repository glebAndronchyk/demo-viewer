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
import GroupsPage from "./pages/groups/GroupsPage.tsx";
import { useGroupsPageViewModel } from "./pages/groups/viewmodel/GroupsPageViewModel.tsx";
import { useGroupDetailViewModel } from "./pages/groups/viewmodel/GroupDetailViewModel.tsx";

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
          path: "groups",
          element: <GroupsPage />, // todo: prevent loaders rerun on search param change
          loader: useGroupsPageViewModel.loader,
          children: [
            {
              index: true,
              loader: useGroupsPageViewModel.redirectLoader,
              element: null,
            },
            {
              path: ":id",
              element: <GroupsPage.DetailPage />,
              loader: useGroupDetailViewModel.loader,
              children: [
                {
                  index: true,
                  loader: useGroupDetailViewModel.redirectLoader,
                  element: null,
                },
                {
                  path: "members",
                  element: <GroupsPage.DetailPage.MembersPage />,
                  loader: useGroupDetailViewModel.loader,
                },
                {
                  path: "matches",
                  element: <GroupsPage.DetailPage.MatchesPage />,
                  loader: useGroupDetailViewModel.matchesLoader,
                },
                {
                  path: "settings",
                  element: <GroupsPage.DetailPage.SettingsPage />,
                  loader: useGroupDetailViewModel.loader,
                },
              ],
            },
          ],
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
