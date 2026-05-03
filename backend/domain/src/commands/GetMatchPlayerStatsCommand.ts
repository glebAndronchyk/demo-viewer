import type { GenericCommand } from "../lib/command_bus";
import type { PlayerStatsEntity } from "../entities/PlayerStatsEntity.ts";

export interface GetMatchPlayerStatsCommand
  extends GenericCommand<"get_match_player_stats"> {
  matchId: string;
  steamId: string;
}

export interface GetMatchPlayerStatsCommandResult {
  stats: PlayerStatsEntity;
}
