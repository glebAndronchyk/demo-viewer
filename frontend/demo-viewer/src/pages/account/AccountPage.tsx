import { AccountMenu } from "./components/AccountMenu.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";
import { Layout } from "antd";
import { Outlet } from "react-router";
import StatisticsPage from "./pages/StatisticsPage.tsx";
import { Paper } from "../../components/Paper";

export const AccountPage = () => {
  return (
    <Layout className="h-full p-5">
      <Paper as={Layout.Sider} className="overflow-hidden mr-3 border">
        <AccountMenu />
      </Paper>
      <Layout.Content>
        <Outlet />
      </Layout.Content>
    </Layout>
  );
};

AccountPage.SettingsPage = SettingsPage;
AccountPage.StatisticsPage = StatisticsPage;
