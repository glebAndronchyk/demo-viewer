import type { GenericCommand } from "../lib/command_bus";
import type { PlayerEconomyEntity } from "../entities/PlayerEconomyEntity.ts";
import type { PlayerAccuracyEntity } from "../entities/PlayerAccuracyEntity.ts";
import type { PlayerClutchesEntity } from "../entities/PlayerClutchesEntity.ts";

export interface GetPlayerPerformanceAnalyticsCommand extends GenericCommand<"get_player_performance_analytics"> {
  steamId: string;
  startDate: Date;
}

export interface GetPlayerPerformanceAnalyticsCommandResult {
  accuracy: Omit<PlayerAccuracyEntity, "statsId">;
  clutches: Omit<PlayerClutchesEntity, "statsId">;
}
