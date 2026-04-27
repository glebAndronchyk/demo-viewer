import { AnalyticsCalculator } from "./types/AnalyticsCalculator.ts";
import type { MatchOutboundPort } from "../../ports/outbound/MatchOutboundPort.ts";
import { KillEvent, PlayerHurtEvent } from "../../entities/events";
import type { PlayerStatsEntity } from "../../entities/PlayerStatsEntity.ts";
import { Weapon } from "../../entities/WeaponType.ts";

/**
 * Aggregates the data related to basic match metrics (like KAST except of trades)
 */
export class MatchPlayerStatsCalculator extends AnalyticsCalculator<PlayerStatsEntity> {
  /**
   * Events should be primary source of truth. Using the aggregated player_states might ignore some cases
   * @private
   */
  private async sharedQuery() {
    return await this.matchOutbound.getAggregatedEvents(
      { matchId: this.matchId },
      [
        KillEvent.query().asKiller(this.playerSteamId).build(),
        KillEvent.query().asVictim(this.playerSteamId).build(),
        KillEvent.query().asAssister(this.playerSteamId).build(),
        PlayerHurtEvent.query().asAttacker(this.playerSteamId).build(),
      ],
      {
        get: () =>
          this.dbCache.get("totalKills") as [
            KillEvent[],
            KillEvent[],
            KillEvent[],
            PlayerHurtEvent[],
          ],
        set: (kills) => this.dbCache.set("totalKills", kills),
      },
    );
  }

  override async calculate(): Promise<PlayerStatsEntity> {
    await this.sharedQuery(); // pre-cache frequently used events

    const [
      totalAdr,
      totalApr,
      totalAssists,
      totalDeaths,
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
      _analyticsType: "stats",
      createdAt: createdAt,
      dateRecorded: createdAt,
      updatedAt: createdAt,
      matchId: this.matchId,
      participantSteamId: this.playerSteamId,
      totalAdr,
      totalApr,
      totalAssists,
      totalDeaths,
      totalHs,
      totalKills,
      totalKpr,
      totalMvps,
      totalRoundsPlayed,
      totalScore,
      totalUtilityDamage,
    };
  }

  /**
   * Gets total kills of the player in the match by counting KillEvent where killer is player
   */
  async getTotalKills() {
    const [killEvents] = await this.sharedQuery();

    return killEvents?.length ?? 0;
  }

  /**
   * Gets total deaths of the player in the match by counting KillEvent where killer is any opponent
   */
  async getTotalDeaths() {
    const [_, deathEvents] = await this.sharedQuery();
    return deathEvents?.length ?? 0;
  }

  /**
   * Gets total assists of the player in the match by counting KillEvent where killer is any teammate/opponent
   */
  async getTotalAssists() {
    const [_, __, assistEvents] = await this.sharedQuery();

    return assistEvents?.length ?? 0;
  }

  /**
   * Gets total kills with headshot in the match by counting KillEvent where killer is player
   */
  async getTotalHs() {
    const [killEvents] = await this.sharedQuery();

    const total = killEvents?.length ?? 0;

    const hsCount = killEvents?.filter((k) => k.isHeadshot).length ?? 0;
    return total === 0 ? 0 : hsCount / total;
  }

  /**
   * Gets total ADR(average damage per round). totalDamage/totalRounds
   */
  async getTotalAdr() {
    const [_, __, ___, killerHurtEvents] = await this.sharedQuery();

    const totalDamage = killerHurtEvents?.reduce<number>((acc, event) => {
      return acc + event.healthDamage;
    }, 0);
    const match = await this.matchOutbound.findByMatchId(this.matchId);
    return !match || match.rounds.length === 0
      ? 0
      : totalDamage / match.rounds.length;
  }

  /**
   * Gets total utility damage by counting PlayerHurtEvents where weapon is grenade
   */
  async getTotalUtilityDamage() {
    const [_, __, ___, killerHurtEvents] = await this.sharedQuery();

    const hurtEventsWhereWeaponUtility = killerHurtEvents.filter((e) =>
      Weapon.grenades.includes(e.weapon as (typeof Weapon.grenades)[number]),
    );
    return hurtEventsWhereWeaponUtility?.reduce((totalUtilityDamage, event) => {
      return totalUtilityDamage + event.healthDamage + event.armorDamage;
    }, 0);
  }

  /**
   * Gets KPR(kills per round). totalKills/totalRounds
   */
  async getTotalKpr() {
    const totalKills = await this.getTotalKills();
    const totalRounds = await this.getTotalRoundsPlayed();

    return totalRounds === 0 ? 0 : totalKills / totalRounds;
  }

  /**
   * Gets APR(assists per round). totalAssists/totalRounds
   */
  async getTotalApr() {
    const totalAssists = await this.getTotalAssists();
    const totalRounds = await this.getTotalRoundsPlayed();

    return totalRounds === 0 ? 0 : totalAssists / totalRounds;
  }

  /**
   * Gets MVPs of the player in the match by checking last available frame with player data. MIGHT NOT BE RELIABLE ALL THE TIME
   */
  async getTotalMvps() {
    const state = await this.matchOutbound.getPlayerFinalStateForMatch(
      this.matchId,
      this.playerSteamId,
    );

    return state.mvps;
  }

  /**
   * Gets total score of the player in the match by checking last available frame with player data. MIGHT NOT BE RELIABLE ALL THE TIME
   */
  async getTotalScore() {
    const state = await this.matchOutbound.getPlayerFinalStateForMatch(
      this.matchId,
      this.playerSteamId,
    );

    return state.score;
  }

  /**
   * Gets total rounds where player was active (connected) and had physical team (CT or T)
   */
  @AnalyticsCalculator.cache()
  async getTotalRoundsPlayed(): Promise<number> {
    const rounds = await this.matchOutbound.getRoundsPlayedByPlayer(
      this.matchId,
      this.playerSteamId,
    );
    return rounds.length;
  }
}
