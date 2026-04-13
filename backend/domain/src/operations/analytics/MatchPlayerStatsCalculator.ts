import { AnalyticsCalculator } from "./types/AnalyticsCalculator.ts";
import type { MatchOutboundPort } from "../../ports/outbound/MatchOutboundPort.ts";
import { KillEvent, PlayerHurtEvent } from "../../entities/events";
import {
  grenades,
  type GrenadesWeaponType,
} from "../../entities/WeaponType.ts";
import type { PlayerStatsEntity } from "../../entities/PlayerStatsEntity.ts";

export class MatchPlayerStatsCalculator extends AnalyticsCalculator<PlayerStatsEntity> {
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

  /**
   * Events should be primary source of truth. Using the aggregated player_states might ignore some cases
   * @private
   */
  private async sharedKillsQuery() {
    return await this.matchOutbound.getAggregatedEvents(
      { matchId: this.matchId },
      [
        KillEvent.asKiller(this.playerSteamId),
        KillEvent.asVictim(this.playerSteamId),
        KillEvent.asAssister(this.playerSteamId),
        PlayerHurtEvent.asAttacker(this.playerSteamId),
      ],
      {
        get: () =>
          this.eventsCache.get("totalKills") as [
            KillEvent[],
            KillEvent[],
            KillEvent[],
            PlayerHurtEvent[],
          ],
        set: (kills) => this.eventsCache.set("totalKills", kills),
      },
    );
  }

  override async calculate(): Promise<PlayerStatsEntity> {
    const [
      totalAdr,
      totalApr,
      totalAssists,
      totalDeaths,
      totalDpr,
      totalHs,
      totalKills,
      totalKpr,
      totalRoundsPlayed,
      totalScore,
      totalUtilityDamage,
      totalMvps,
    ] = await Promise.all([
      this.getTotalAdr().catch(() => 0),
      this.getTotalApr().catch(() => 0),
      this.getTotalAssists().catch(() => 0),
      this.getTotalDeaths().catch(() => 0),
      this.getTotalDpr().catch(() => 0),
      this.getTotalHs().catch(() => 0),
      this.getTotalKills().catch(() => 0),
      this.getTotalKpr().catch(() => 0),
      this.getTotalRoundsPlayed().catch(() => 0),
      this.getTotalScore().catch(() => 0),
      this.getTotalUtilityDamage().catch(() => 0),
      this.getTotalMvps().catch(() => 0),
    ]);

    const createdAt = new Date();

    return {
      createdAt: createdAt,
      dateRecorded: createdAt,
      updatedAt: createdAt,
      matchId: this.matchId,
      participantSteamId: this.playerSteamId,
      totalAdr,
      totalApr,
      totalAssists,
      totalDeaths,
      totalDpr,
      totalHs,
      totalKills,
      totalKpr,
      totalMvps,
      totalRoundsPlayed,
      totalScore,
      totalUtilityDamage,
    };
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

    const hsCount = killEvents?.filter((k) => k.isHeadshot).length ?? 0;
    return total === 0 ? 0 : hsCount / total;
  }

  async getTotalAdr() {
    const [_, __, ___, killerHurtEvents] = await this.sharedKillsQuery();

    const totalDamage = killerHurtEvents?.reduce<number>((acc, event) => {
      return acc + event.healthDamage + event.armorDamage;
    }, 0);
    const totalRounds = await this.getTotalRoundsPlayed();
    return totalRounds === 0 ? 0 : totalDamage / totalRounds;
  }

  async getTotalUtilityDamage() {
    const [_, __, ___, killerHurtEvents] = await this.sharedKillsQuery();

    const hurtEventsWhereWeaponUtility = killerHurtEvents.filter((e) =>
      grenades.includes(e.weapon as GrenadesWeaponType),
    );
    return hurtEventsWhereWeaponUtility?.reduce((totalUtilityDamage, event) => {
      return totalUtilityDamage + event.healthDamage + event.armorDamage;
    }, 0);
  }

  async getTotalKpr() {
    const totalKills = await this.getTotalKills();
    const totalRounds = await this.getTotalRoundsPlayed();

    return totalRounds === 0 ? 0 : totalKills / totalRounds;
  }

  async getTotalDpr() {
    const totalDeaths = await this.getTotalDeaths();
    const totalRounds = await this.getTotalRoundsPlayed();

    return totalRounds === 0 ? 0 : totalDeaths / totalRounds;
  }

  async getTotalApr() {
    const totalAssists = await this.getTotalAssists();
    const totalRounds = await this.getTotalRoundsPlayed();

    return totalRounds === 0 ? 0 : totalAssists / totalRounds;
  }

  async getTotalMvps() {
    const state = await this.matchOutbound.getPlayerFinalStateForMatch(
      this.matchId,
      this.playerSteamId,
    );

    return state.mvps;
  }

  async getTotalScore() {
    const state = await this.matchOutbound.getPlayerFinalStateForMatch(
      this.matchId,
      this.playerSteamId,
    );

    return state.score;
  }

  @AnalyticsCalculator.cache()
  async getTotalRoundsPlayed(): Promise<number> {
    const rounds = await this.matchOutbound.getRoundsPlayedByPlayer(
      this.matchId,
      this.playerSteamId,
    );
    return rounds.length;
  }
}
