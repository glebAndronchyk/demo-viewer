import type { PlayerAccuracyDto } from "@demo-viewer/shared-types";
import { Treemap } from "@ant-design/plots";

interface HitBreakdownMapProps {
  accuracy: PlayerAccuracyDto;
}

export const HitBreakdownMap = (props: HitBreakdownMapProps) => {
  const {
    accuracy: { hitBreakdown },
  } = props;

  const total = Object.values(hitBreakdown || {}).reduce((s, v) => s + v, 0);
  const options = Object.entries(hitBreakdown || {})
    .filter(([, v]) => v > 0 && v / total >= 0.02)
    .map<{ name: string; value: number }>(([k, v]) => ({
      name: `${k}: ${v} hits`,
      value: v,
    }));

  return (
    <Treemap
      colorField="value"
      valueField="value"
      legend={false}
      tooltip={false}
      data={{ name: "root", children: options }}
    />
  );
};
