import { clsx } from "../../lib/clsx.ts";
import { Paper } from "../Paper";

export interface PlayerData {
  health: number;
  name: string;
  weapon: string | null;
  utilities: string[];
  side: "CT" | "T" | null;
  state: "dead" | "alive";
  steamId: string;
  disconnected: boolean;
}

export type PlayerCardProps = PlayerData & {
  className?: string;
};

export const PlayerCard = (props: PlayerCardProps) => {
  return (
    <Paper className={clsx("gap-1 p-1 flex-1 border", props.className)}>
      <p>{props.name}</p>
      <p>{props.weapon}</p>
      <p>{props.health}</p>
      <p>{props.state}</p>
      <p>{props.side}</p>
    </Paper>
  );
};
