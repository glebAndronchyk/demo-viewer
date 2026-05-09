import { Tabs } from "antd";
import {
  Outlet,
  useLocation,
  type LoaderFunction,
  useNavigate,
} from "react-router";
import type { AuthUser } from "../../../modules/auth";
import { basicStatsLoader } from "../lib/basicStatsLoader.ts";
import type {
  EconomyAnalyticsResponseDto,
  WeaponAnalyticsResponseDto,
} from "@demo-viewer/shared-types";

const tabItems = [
  {
    label: "Weapons",
    key: "weapons",
  },
  {
    label: "Economics",
    key: "economics",
  },
  {
    label: "Performance",
    key: "performance",
  },
];

const StatisticsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const onTabChange = (key: string) => {
    navigate(key);
  };

  const activeTab = tabItems.find((t) => location.pathname.includes(t.key))!;

  return (
    <div>
      <Tabs
        activeKey={activeTab?.key}
        onChange={onTabChange}
        items={tabItems}
      />
      <Outlet />
    </div>
  );
};

StatisticsPage.Economics = Object.assign(
  () => {
    return <p>Eco</p>;
  },
  {
    loader: (user: AuthUser | null) =>
      (async (args) => {
        const { steamId, startDate } = basicStatsLoader(args, user);

        // todo: proper http client
        const result = await fetch(
          `http://localhost:3000/statistics/total/economy?steamId=${steamId}&startDate="${startDate}"`,
        )
          .then((r) => r.json())
          .then((r) => r as EconomyAnalyticsResponseDto)
          .then((r) => r.data);

        return result;
      }) satisfies LoaderFunction,
  },
);

StatisticsPage.Weapons = Object.assign(
  () => {
    return <p>Weapons</p>;
  },
  {
    loader: (user: AuthUser | null) =>
      (async (args) => {
        const { steamId, startDate } = basicStatsLoader(args, user);

        // todo: proper http client
        const result = await fetch(
          `http://localhost:3000/statistics/total/weapons?steamId=${steamId}&startDate="${startDate}"`,
        )
          .then((r) => r.json())
          .then((r) => r as WeaponAnalyticsResponseDto)
          .then((r) => r.data);

        return result;
      }) satisfies LoaderFunction,
  },
);

export default StatisticsPage;
