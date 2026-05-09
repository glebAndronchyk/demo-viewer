import { Select } from "antd";
import { Radar } from "@ant-design/plots";
import type {
  PlayerWeaponStatsDto,
  WeaponStatsEntryDto,
} from "@demo-viewer/shared-types";
import { useState } from "react";

type PerWeaponFilters = Pick<
  WeaponStatsEntryDto,
  "damage" | "deaths" | "hits" | "headshots" | "kills" | "shots"
>;

interface PerWeaponUsageProps {
  perWeaponUsage: PlayerWeaponStatsDto;
}

const selectOptions = [
  { label: "Damage", value: "damage" },
  { label: "Deaths", value: "deaths" },
  { label: "Hits", value: "hits" },
  { label: "Headshots", value: "headshots" },
  { label: "Kills", value: "kills" },
  { label: "Shots", value: "shots" },
] satisfies Array<{
  value: keyof PerWeaponFilters;
  label: string;
}>;

export const PerWeaponUsage = (props: PerWeaponUsageProps) => {
  const { perWeaponUsage } = props;
  const [activeFilter, setActiveFilter] =
    useState<keyof PerWeaponFilters>("damage");

  const handleSelectChange = (value: keyof PerWeaponFilters) => {
    setActiveFilter(value);
  };

  const filteredPlot = perWeaponUsage.weapons.map((w) => {
    const value = w[activeFilter];

    return {
      item: w.weaponName,
      type: activeFilter,
      score: value,
    };
  });

  const maxScore = Math.max(...filteredPlot.map((p) => p.score));

  return (
    <div>
      <Select
        value={activeFilter}
        onChange={handleSelectChange}
        options={selectOptions}
      />
      {/* todo: reuse */}
      <Radar
        className="w-full h-[20%] [&>canvas]:w-full! [&>canvas]:h-full!"
        legend={null}
        data={filteredPlot}
        xField="item"
        yField="score"
        colorField="type"
        coordinateType="polar"
        scale={{ y: { domainMax: maxScore } }}
        axis={{
          x: {
            grid: true,
            gridLineWidth: 1,
            gridLineDash: [0, 0],
          },
          y: {
            grid: true,
            gridLineWidth: 1,
            gridLineDash: [1, 0],
          },
        }}
        point={{
          shapeField: "point",
          sizeField: 3,
        }}
        style={{
          lineWidth: 2,
        }}
        area={{
          style: {
            fillOpacity: 0.5,
          },
        }}
      />
    </div>
  );
};
