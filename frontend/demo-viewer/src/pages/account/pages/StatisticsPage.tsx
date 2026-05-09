import { Flex, Layout, Tabs } from "antd";

import {
  Outlet,
  useLocation,
  type LoaderFunction,
  useNavigate,
  useLoaderData,
} from "react-router";
import type { AuthUser } from "../../../modules/auth";
import { basicStatsLoader } from "../lib/basicStatsLoader.ts";
import type {
  EconomyAnalyticsResponseDto,
  WeaponAnalyticsResponseData,
  WeaponAnalyticsResponseDto,
} from "@demo-viewer/shared-types";
import { WeaponUsageRadar } from "../components/WeaponUsageRadar.tsx";
import { Section } from "../components/Section.tsx";
import { GrenadesUsage } from "../components/GrenadesUsage.tsx";

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
    <Layout className="max-h-full overflow-y-auto">
      <Tabs
        activeKey={activeTab?.key}
        onChange={onTabChange}
        items={tabItems}
      />
      <Outlet />
    </Layout>
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
    const data = useLoaderData<WeaponAnalyticsResponseData>();

    return (
      <Flex orientation="vertical">
        <Section title="Weapon Usage" first>
          <WeaponUsageRadar weaponUsage={data.weaponUsagePct} />
        </Section>
        <Section title="Per Weapon stats">
          <WeaponUsageRadar weaponUsage={data.weaponUsagePct} />
        </Section>
        <Section title="Grenades Usage">
          <GrenadesUsage grenadesUsage={data.utilityUsage} />
        </Section>
      </Flex>
    );
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
