import { AnalyticsCalculator } from "./types/AnalyticsCalculator.ts";
import {
  ItemPickupEvent,
  KillEvent,
  PlayerHurtEvent,
} from "../../entities/events";
import type { MatchOutboundPort } from "../../ports/outbound/MatchOutboundPort.ts";

export class MatchPlayerEconomyCalculator extends AnalyticsCalculator<any> {
  constructor(
    private readonly matchId: string,
    private readonly playerSteamId: string,
    matchOutbound: MatchOutboundPort,
  ) {
    super(matchOutbound);
  }

  private async sharedQuery() {
    return await this.matchOutbound.getAggregatedEvents(
      { matchId: this.matchId },
      [
        ItemPickupEvent.query()
          .forPlayer(this.playerSteamId)
          .asBought()
          .inTickRange([0, 100])
          .build(),
      ],
      {
        get: () => this.dbCache.get("sharedQuery") as [ItemPickupEvent[]],
        set: (v) => this.dbCache.set("sharedQuery", v),
      },
    );
  }

  override async calculate() {
    await this.sharedQuery(); // pre-cache
  }
}
