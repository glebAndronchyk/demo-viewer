import { Pie } from "@ant-design/plots";
import type { PlayerEconomyDto } from "@demo-viewer/shared-types";

interface RoundEconomyPieProps {
  roundEconomyStats: PlayerEconomyDto;
}

export const RoundEconomyPie = (props: RoundEconomyPieProps) => {
  const { roundEconomyStats } = props;

  const options = [
    {
      type: "Eco",
      value:
        (roundEconomyStats.roundsEco ?? 0) -
        (roundEconomyStats.roundsEcoWon ?? 0),
      color: "#8fff89",
    },
    {
      type: "Eco Won",
      value: roundEconomyStats.roundsEcoWon ?? 0,
      color: "#0aff00",
    },
    {
      type: "Force",
      value: roundEconomyStats.roundsForceBuy ?? 0,
      color: "#ffa352",
    },
    {
      type: "Full",
      value: roundEconomyStats.roundsFullBuy ?? 0,
      color: "#4566ff",
    },
  ] satisfies { type: string; value: number; color: string }[];

  return (
    <Pie
      angleField="value"
      colorField="type"
      data={options}
      legeng={null}
      tooltip={false}
      scale={{
        color: {
          range: options.map((o) => o.color),
        },
      }}
      label={{
        text: (d: { type: string; value: number }) => `${d.type}: ${d.value}`,
        style: {
          color: "black",
        },
      }}
    />
  );
};
