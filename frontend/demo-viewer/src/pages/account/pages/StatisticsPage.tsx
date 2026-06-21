import { Flex, Form, Layout, Tabs } from "antd";

import {
  Outlet,
  useLocation,
  type LoaderFunction,
  useNavigate,
  useLoaderData,
  useSearchParams,
} from "react-router";
import type { AuthUser } from "../../../modules/auth";
import { basicStatsLoader } from "../lib/basicStatsLoader.ts";
import type {
  EconomyAnalyticsResponseData,
  EconomyAnalyticsResponseDto,
  PerformanceAnalyticsResponseData,
  PerformanceAnalyticsResponseDto,
  WeaponAnalyticsResponseData,
  WeaponAnalyticsResponseDto,
} from "@demo-viewer/shared-types";
import { WeaponUsageRadar } from "../components/WeaponUsageRadar.tsx";
import { Section } from "../components/Section.tsx";
import { GrenadesUsage } from "../components/GrenadesUsage.tsx";
import { PerWeaponUsage } from "../components/PerWeaponUsage.tsx";
import { format, isValid, parse } from "date-fns";
import DatePicker from "../../../components/DatePicker/DatePicker.tsx";
import { RoundEconomyPie } from "../components/RoundEconomyPie.tsx";
import { TotalShotsHitsBar } from "../components/TotalShotsHitsBar.tsx";
import { TopLevelAccuracyLiquid } from "../components/TopLevelAccuracyLiquid.tsx";
import { HitBreakdownMap } from "../components/HitBreakdownMap.tsx";
import { ClutchesBar } from "../components/ClutchesBar.tsx";
import { AppConfiguration } from "../../../features/configuration";

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
  const [searchParams, setSearchParams] = useSearchParams();

  const onTabChange = (key: string) => {
    navigate(key);
  };

  const dateParam = searchParams.get("startDate");
  const pickerValue = (() => {
    if (!dateParam) return null;
    const d = parse(dateParam, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : null;
  })();

  const onDateChange = (date: Date | null) => {
    setSearchParams((prev) => {
      if (!date) {
        prev.delete("startDate");
      } else {
        prev.set("startDate", format(date, "yyyy-MM-dd"));
      }
      return prev;
    });
  };

  const activeTab = tabItems.find((t) => location.pathname.includes(t.key))!;

  return (
    <Layout className="max-h-full overflow-y-auto relative">
      <Form.Item label="Start date" className="mb-0!">
        <DatePicker
          value={pickerValue}
          placeholder="Select start date"
          onChange={onDateChange}
          picker="month"
        />
      </Form.Item>
      <Tabs
        activeKey={activeTab?.key}
        onChange={onTabChange}
        items={tabItems}
      />
      <Outlet />
    </Layout>
  );
};

StatisticsPage.Performance = Object.assign(
  () => {
    const data = useLoaderData<PerformanceAnalyticsResponseData>();

    return (
      <Flex orientation="vertical">
        <Section first title="Accuracy breakdown">
          <Flex orientation="horizontal">
            <TotalShotsHitsBar accuracy={data.accuracy} />
            <TopLevelAccuracyLiquid accuracy={data.accuracy} />
          </Flex>
        </Section>
        <Section title="Hits breakdown">
          <HitBreakdownMap accuracy={data.accuracy} />
        </Section>

        <Section title="Clutches breakdown">
          <ClutchesBar clutches={data.clutches} />
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
          `${AppConfiguration.apiUrl}/statistics/total/performance?steamId=${steamId}&startDate="${startDate}"`,
        )
          .then((r) => r.json())
          .then((r) => r as PerformanceAnalyticsResponseDto)
          .then((r) => r.data);

        return result;
      }) satisfies LoaderFunction,
  },
);

StatisticsPage.Economics = Object.assign(
  () => {
    const data = useLoaderData<EconomyAnalyticsResponseData>();

    return (
      <Flex orientation="vertical">
        <Section first title="Economy behavior chart">
          <RoundEconomyPie roundEconomyStats={data.economyUsage} />
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
          `${AppConfiguration.apiUrl}/statistics/total/economy?steamId=${steamId}&startDate="${startDate}"`,
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
        {Boolean(data.weaponStats.weapons) && (
          <Section title="Per Weapon stats">
            <PerWeaponUsage perWeaponUsage={data.weaponStats} />
          </Section>
        )}
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
          `${AppConfiguration.apiUrl}/statistics/total/weapons?steamId=${steamId}&startDate="${startDate}"`,
        )
          .then((r) => r.json())
          .then((r) => r as WeaponAnalyticsResponseDto)
          .then((r) => r.data);

        return result;
      }) satisfies LoaderFunction,
  },
);

export default StatisticsPage;
