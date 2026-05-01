import { AnalyticsCalculator } from "./types/AnalyticsCalculator.ts";
import type { PlayerAccuracyEntity } from "../../entities/PlayerAccuracyEntity.ts";
import {
  KillEvent,
  PlayerHurtEvent,
  WeaponFireEvent,
} from "../../entities/events";
import type { HitGroup } from "../../entities/HitGroup.ts";

// todo: link to matchPlayerStats on db level

export class MatchAccuracyCalculator extends AnalyticsCalculator<
  Omit<PlayerAccuracyEntity, "statsId">
> {
  private async sharedQuery() {
    return await this.matchOutbound.getAggregatedEvents(
      {
        matchId: this.matchId,
      },
      [
        KillEvent.query().asKiller(this.playerSteamId).asHeadshot().build(),
        PlayerHurtEvent.query().asAttacker(this.playerSteamId).build(),
        WeaponFireEvent.query().asShooter(this.playerSteamId).build(),
      ],
      {
        get: () =>
          this.dbCache.get("sharedQuery") as [
            KillEvent[],
            PlayerHurtEvent[],
            WeaponFireEvent[],
          ],
        set: (events) => this.dbCache.set("sharedQuery", events),
      },
    );
  }

  override async calculate(): Promise<Omit<PlayerAccuracyEntity, "statsId">> {
    await this.sharedQuery(); // pre-cache

    const [headshots, totalShot, totalHits, accuracyPercentage, hitBreakdown] =
      await Promise.all([
        this.getHeadshots().catch(() => 0),
        this.getTotalShots().catch(() => 0),
        this.getTotalHits().catch(() => 0),
        this.getAccuracyPercentage().catch(() => 0),
        this.getHitBreakdown().catch(() => null),
      ]);

    const createdAt = new Date();

    return {
      _analyticsType: "accuracy",
      dateRecorded: createdAt,
      headshots: headshots,
      hitBreakdown: hitBreakdown || ({} as Record<HitGroup, number>),
      topLevelAccuracy: accuracyPercentage,
      totalHits: totalHits,
      totalShots: totalShot,
    };
  }

  async getTotalShots() {
    const [_, __, shots] = await this.sharedQuery();

    return shots.length;
  }

  async getTotalHits() {
    const [_, hits] = await this.sharedQuery();

    return hits.length;
  }

  async getHeadshots() {
    const [kills] = await this.sharedQuery();

    return kills.length;
  }

  async getAccuracyPercentage() {
    const hits = await this.getTotalHits();
    const shots = await this.getTotalShots();

    return shots === 0 ? 0 : hits / shots;
  }

  async getHitBreakdown() {
    const [_, hits] = await this.sharedQuery();
    const hitGroups = Object.groupBy(hits, (hit) => {
      return hit.hitGroup;
    });

    return Object.fromEntries(
      Object.entries(hitGroups).map(([key, value]) => [key, value?.length ?? 0]),
    ) as Record<HitGroup, number>;
  }
}
