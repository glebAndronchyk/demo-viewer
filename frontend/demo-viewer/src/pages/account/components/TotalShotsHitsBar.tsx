import { Bar } from "@ant-design/plots";
import type { PlayerAccuracyDto } from "@demo-viewer/shared-types";

interface TotalShotsHitsHistoProps {
  accuracy: PlayerAccuracyDto;
}

export const TotalShotsHitsBar = (props: TotalShotsHitsHistoProps) => {
  const { accuracy } = props;

  const options = [
    { label: "Total shots", value: accuracy.totalShots ?? 0 },
    { label: "Total hits", value: accuracy.totalHits ?? 0 },
    { label: "Headshots", value: accuracy.headshots ?? 0 },
  ] satisfies { label: string; value: number }[];

  return (
    <Bar
      tooltip={false}
      label={{ text: "value", style: { dx: -10 } }}
      data={options}
      xField="label"
      yField="value"
    />
  );
};
