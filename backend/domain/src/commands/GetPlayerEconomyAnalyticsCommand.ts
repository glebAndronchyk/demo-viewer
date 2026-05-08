import type { GenericCommand } from "../lib/command_bus";
import type { PlayerEconomyEntity } from "../entities/PlayerEconomyEntity.ts";

export interface GetPlayerEconomyAnalyticsCommand
  extends GenericCommand<"get_player_economy_analytics"> {
  steamId: string;
  startDate: Date;
}

export interface GetPlayerEconomyAnalyticsCommandResult {
  economyUsage: Omit<PlayerEconomyEntity, "statsId">;
}
