import { Radar } from "@ant-design/plots";
import type { PlayerWeaponsUsageDto } from "@demo-viewer/shared-types";

interface WeaponUsageRadarProps {
  weaponUsage: PlayerWeaponsUsageDto;
}

export const WeaponUsageRadar = (props: WeaponUsageRadarProps) => {
  const { _analyticsType, statsId, dateRecorded, ...weaponUsage } =
    props.weaponUsage;

  const options = Object.entries(weaponUsage).map(([key, value]) => {
    return { item: key, type: "Weapon Type", score: value };
  });

  return (
    <Radar
      className="w-full h-[20%] [&>canvas]:w-full! [&>canvas]:h-full!"
      legend={null}
      data={options}
      xField="item"
      yField="score"
      colorField="type"
      coordinateType="polar"
      scale={{ y: { domainMax: 1 } }}
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
  );
};
