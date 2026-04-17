import { AnalyticsCalculator } from "./types/AnalyticsCalculator.ts";
import type { PlayerWeaponsUsageEntity } from "../../entities/PlayerWeaponsUsageEntity.ts";
import { WeaponFireEvent } from "../../entities/events";
import { Weapon } from "../../entities/WeaponType.ts";

export class MatchPlayerWeaponsUsageCalculator extends AnalyticsCalculator<
  Omit<PlayerWeaponsUsageEntity, "statsId">
> {
  private async sharedQuery() {
    return await this.matchOutbound.getAggregatedEvents(
      { matchId: this.matchId },
      [WeaponFireEvent.query().asShooter(this.playerSteamId).build()],
      {
        get: () =>
          this.dbCache.get("sharedQuery") as [WeaponFireEvent[]],
        set: (events) => this.dbCache.set("sharedQuery", events),
      },
    );
  }

  override async calculate(): Promise<
    Omit<PlayerWeaponsUsageEntity, "statsId">
  > {
    await this.sharedQuery(); // pre-cache

    const [
      pistolsPct,
      utilityPct,
      meleePct,
      shotgunsPct,
      smgPct,
      assaultRiflePct,
      sniperRiflePct,
      machineGunPct,
    ] = await Promise.all([
      this.getPistolsPct().catch(() => 0),
      this.getUtilityPct().catch(() => 0),
      this.getMeleePct().catch(() => 0),
      this.getShotgunsPct().catch(() => 0),
      this.getSmgPct().catch(() => 0),
      this.getAssaultRiflePct().catch(() => 0),
      this.getSniperRiflePct().catch(() => 0),
      this.getMachineGunPct().catch(() => 0),
    ]);

    return {
      _analyticsType: "weaponsUsage",
      pistolsPct,
      utilityPct,
      meleePct,
      shotgunsPct,
      smgPct,
      assaultRiflePct,
      sniperRiflePct,
      machineGunPct,
      dateRecorded: new Date(),
    };
  }

  private async getCategoryPct(
    categoryWeapons: readonly string[],
  ): Promise<number> {
    const [fireEvents] = await this.sharedQuery();
    const total = fireEvents.length;
    if (total === 0) return 0;
    const categoryShots = fireEvents.filter((e) =>
      categoryWeapons.includes(e.weapon),
    ).length;
    return categoryShots / total;
  }

  async getPistolsPct(): Promise<number> {
    return this.getCategoryPct(Weapon.pistols);
  }

  async getUtilityPct(): Promise<number> {
    return this.getCategoryPct(Weapon.grenades);
  }

  async getMeleePct(): Promise<number> {
    return this.getCategoryPct(Weapon.meleeAndEquipment);
  }

  async getShotgunsPct(): Promise<number> {
    return this.getCategoryPct(Weapon.shotguns);
  }

  async getSmgPct(): Promise<number> {
    return this.getCategoryPct(Weapon.smgs);
  }

  async getAssaultRiflePct(): Promise<number> {
    return this.getCategoryPct(Weapon.assaultRifles);
  }

  async getSniperRiflePct(): Promise<number> {
    return this.getCategoryPct(Weapon.sniperRifles);
  }

  async getMachineGunPct(): Promise<number> {
    return this.getCategoryPct(Weapon.machineGuns);
  }
}
