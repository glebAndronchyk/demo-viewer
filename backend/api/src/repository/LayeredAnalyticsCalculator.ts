import { MatchPlayerStatsCalculator } from "@demo-viewer/domain/src/operations/analytics/MatchPlayerStatsCalculator";
import { MatchClutchCalculator } from "@demo-viewer/domain/src/operations/analytics/MatchClutchCalculator";
import { MatchPlayerWeaponsUsageCalculator } from "@demo-viewer/domain/src/operations/analytics/MatchPlayerWeaponsUsageCalculator";
import { MatchPlayerWeaponStatsCalculator } from "@demo-viewer/domain/src/operations/analytics/MatchPlayerWeaponStatsCalculator";
import { MatchPlayerUtilityUsageCalculator } from "@demo-viewer/domain/src/operations/analytics/MatchPlayerUtilityUsageCalculator";
import { MatchPlayerEconomyCalculator } from "@demo-viewer/domain/src/operations/analytics/MatchPlayerEconomyCalculator";
import { MatchOutboundPort } from "@demo-viewer/domain/src/ports/outbound/MatchOutboundPort";
import { QueueOutboundPort } from "@demo-viewer/domain/src/ports/outbound/QueueOutboundPort";
import { MatchParticipant } from "@demo-viewer/domain/src/entities/MatchEntity";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";
import { MatchAccuracyCalculator } from "@demo-viewer/domain/src/operations/analytics/MatchAccuracyCalculator";
import { PlayerStatsEntity } from "@demo-viewer/domain/src/entities/PlayerStatsEntity";

export class LayeredAnalyticsCalculator {
  private readonly pipelines = {
    l1: [
      MatchPlayerStatsCalculator,
      MatchClutchCalculator,
      MatchPlayerWeaponsUsageCalculator,
      MatchPlayerWeaponStatsCalculator,
      MatchPlayerUtilityUsageCalculator,
      MatchPlayerEconomyCalculator,
      MatchAccuracyCalculator,
    ],
    l2: [],
  } as const;

  constructor(
    private readonly matchRepository: MatchOutboundPort,
    private readonly queue: QueueOutboundPort,
    private readonly configuration: ConfigurationInboundPort,
  ) {}

  async calculate(matchId: string) {
    const match = await this.matchRepository.findByMatchId(matchId);
    if (!match) throw new Error("Match not found.");

    const players = match.participants;

    this.queue.enqueue(() =>
      Promise.all(
        players.map((p) =>
          this.runPipelinesForPlayer.apply(this, [p, matchId]),
        ),
      ),
    );
  }

  private async runPipelinesForPlayer(
    player: MatchParticipant,
    matchId: string,
  ) {
    const steamId = player.steamId;

    if (!steamId) return;

    const l1Calculators = this.pipelines["l1"].map(
      (ctr) => new ctr(matchId, steamId, this.matchRepository),
    );

    const results = await Promise.all(
      l1Calculators.map((calc) => calc.calculate()),
    );

    const rootAnalytics = results.find(
      (r) => r._analyticsType === "stats",
    )! as PlayerStatsEntity;
    const otherAnalytics = results.filter((r) => r !== rootAnalytics);

    const result = await this.matchRepository.savePlayerAnalyticalData(
      rootAnalytics,
      otherAnalytics,
    );

    if (this.configuration.debug) {
      console.log(
        `[DEBUG][LayeredAnalyticsCalculator] Saved analytics under root entity with id: ${result?.rootCollectionId} for player ${steamId}`,
      );
    }

    // todo when l2 ready calculaet here
  }
}
