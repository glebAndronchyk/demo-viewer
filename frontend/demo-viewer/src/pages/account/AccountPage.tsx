import { AccountMenu } from "./components/AccountMenu.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import { Layout } from "antd";
import { Outlet } from "react-router";
import StatisticsPage from "./pages/StatisticsPage.tsx";

export const AccountPage = () => {
  return (
    <Layout className="h-full p-5">
      <Layout.Sider className="mr-3">
        <AccountMenu />
      </Layout.Sider>
      <Layout.Content>
        <Outlet />
      </Layout.Content>
    </Layout>
  );
};

AccountPage.SettingsPage = SettingsPage;
AccountPage.StatisticsPage = StatisticsPage;
