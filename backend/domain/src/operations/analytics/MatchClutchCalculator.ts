import { AnalyticsCalculator } from "./types/AnalyticsCalculator.ts";
import type { MatchOutboundPort } from "../../ports/outbound/MatchOutboundPort.ts";
import type {
  ClutchStatEntity,
  PlayerClutchesEntity,
  PlayerEntityClutchField,
} from "../../entities/PlayerClutchesEntity.ts";

export class MatchClutchCalculator extends AnalyticsCalculator<
  Omit<PlayerClutchesEntity, "statsId">
> {
  constructor(
    private readonly matchId: string,
    private readonly playerSteamId: string,
    matchOutbound: MatchOutboundPort,
  ) {
    super(matchOutbound);
  }

  /**
   * Calculates clutches by outcome of the round
   */
  override async calculate(): Promise<Omit<PlayerClutchesEntity, "statsId">> {
    const clutches = await this.matchOutbound.getClutchRounds(
      this.matchId,
      this.playerSteamId,
    );

    const groupedEntities = Object.groupBy(clutches, (clutch) => {
      return `clutch1v${clutch.vs}` satisfies PlayerEntityClutchField;
    });

    return Object.fromEntries(
      Object.entries(groupedEntities).map(([key, value]) => [
        key,
        {
          attempted: value?.length || 0,
          won: value?.filter((v) => v.outcome === "won").length || 0,
        } satisfies ClutchStatEntity,
      ]),
    );
  }
}
