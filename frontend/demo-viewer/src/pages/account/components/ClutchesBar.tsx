import { Bar } from "@ant-design/plots";
import type { ClutchStatDto, PlayerClutchesDto } from "@demo-viewer/shared-types";

interface ClutchesBarProps {
  clutches: PlayerClutchesDto;
}

export const ClutchesBar = (props: ClutchesBarProps) => {
  const { clutches } = props;

  const toBar = (type: string, stat: ClutchStatDto | undefined) => {
    const rate = stat && stat.attempted > 0 ? stat.won / stat.attempted : 0;
    return [
      { type, direction: "Won", value: rate },
      { type, direction: "Lost", value: -(1 - rate) },
    ];
  };

  const data = [
    ...toBar("1v1", clutches.clutch1v1),
    ...toBar("1v2", clutches.clutch1v2),
    ...toBar("1v3", clutches.clutch1v3),
    ...toBar("1v4", clutches.clutch1v4),
    ...toBar("1v5", clutches.clutch1v5),
  ];

  return (
    <Bar
      data={data}
      xField="type"
      yField="value"
      colorField="direction"
      stack={true}
      tooltip={false}
      scale={{
        y: { domainMin: -1, domainMax: 1 },
        color: { range: ["#52c41a", "#ff4d4f"] },
      }}
      axis={{
        y: {
          labelFormatter: (v: number) => Math.abs(v).toFixed(2),
        },
      }}
      label={{
        text: (d: { value: number }) => Math.abs(d.value).toFixed(2),
        position: "inside",
      }}
    />
  );
};
