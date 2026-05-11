import type { PlayerAccuracyDto } from "@demo-viewer/shared-types";
import { Liquid } from "@ant-design/plots";

interface TopLevelAccuracyLiquidProps {
  accuracy: PlayerAccuracyDto;
}

export const TopLevelAccuracyLiquid = (props: TopLevelAccuracyLiquidProps) => {
  const { accuracy } = props;

  return (
    <Liquid
      tooltip={false}
      percent={Number(Number(accuracy.topLevelAccuracy ?? 0).toFixed(4))}
    />
  );
};
