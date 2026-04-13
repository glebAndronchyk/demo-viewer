import { AnalyticsCalculator } from "./types/AnalyticsCalculator.ts";
import type {
  EventsCache,
  MatchOutboundPort,
} from "../../ports/outbound/MatchOutboundPort.ts";
import {
  type EventConstructor,
  KillEvent,
  PlayerHurtEvent,
} from "../../entities/events";
import type { PlayerState } from "../../entities/DemoChunkEntity.ts";

export class MatchPlayerStatsCalculator extends AnalyticsCalculator<PlayerState> {
  private readonly eventsCache: Map<string, readonly any[]> = new Map<
    string,
    readonly any[]
  >();

  constructor(
    private readonly matchId: string,
    private readonly playerSteamId: string,
    matchOutbound: MatchOutboundPort,
  ) {
    super(matchOutbound);
  }

  private async sharedKillsQuery() {
    return await this.matchOutbound.getAggregatedEvents(
      { demoId: this.matchId },
      [
        KillEvent.asKiller(this.playerSteamId),
        KillEvent.asVictim(this.playerSteamId),
        KillEvent.asAssister(this.playerSteamId),
      ],
      {
        get: () =>
          this.eventsCache.get("totalKills") as [
            KillEvent[],
            KillEvent[],
            KillEvent[],
          ],
        set: (kills) => this.eventsCache.set("totalKills", kills),
      },
    );
  }

  override async calculate(): Promise<PlayerState> {
    throw new Error("Method not implemented.");
  }

  async getTotalKills() {
    const [killEvents] = await this.sharedKillsQuery();

    return killEvents?.length ?? 0;
  }

  async getTotalDeaths() {
    const [_, deathEvents] = await this.sharedKillsQuery();

    return deathEvents?.length ?? 0;
  }

  async getTotalAssists() {
    const [_, __, assistEvents] = await this.sharedKillsQuery();

    return assistEvents?.length ?? 0;
  }

  async getTotalHs() {
    const [killEvents] = await this.sharedKillsQuery();

    const total = killEvents?.length ?? 0;

    return killEvents?.filter((k) => k.isHeadshot).length ?? 0 / total;
  }

  getTotalAdr() {}

  getTotalUtilityDamage() {}

  async getTotalKpr() {}

  getTotalDpr() {}

  getTotalApr() {}

  getTotalImpact() {}

  getTotalScore() {}

  getTotalRoundsPlayed() {}
}
