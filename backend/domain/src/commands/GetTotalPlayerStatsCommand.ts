import type { GenericCommand } from "../lib/command_bus";
import type { PlayerStatsEntity } from "../entities/PlayerStatsEntity.ts";

export interface GetTotalPlayerStatsCommand
  extends GenericCommand<"get_total_player_stats"> {
  steamId: string;
}

export interface GetTotalPlayerStatsCommandResult {
  stats: PlayerStatsEntity;
}
