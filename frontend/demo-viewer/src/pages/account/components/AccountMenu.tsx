import { Menu } from "antd";
import { Link } from "react-router";
import { RadarChartOutlined, SettingFilled } from "@ant-design/icons";

const menuItems = [
  {
    key: "statistics",
    label: <Link to="/account/statistics/weapons">Statistics</Link>,
    icon: <RadarChartOutlined />,
  },
  {
    key: "sharing-settings",
    label: <Link to="/account/sharing-settings">Sharing settings</Link>,
    icon: <SettingFilled />,
  },
];

export const AccountMenu = () => {
  return <Menu selectedKeys={[]} items={menuItems} mode="inline" />;
};
