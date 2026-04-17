import { AnalyticsCalculator } from "./types/AnalyticsCalculator.ts";
import type {
  PlayerWeaponStatsEntity,
  WeaponStatsEntry,
} from "../../entities/PlayerWeaponStatsEntity.ts";
import {
  KillEvent,
  PlayerHurtEvent,
  WeaponFireEvent,
} from "../../entities/events";

export class MatchPlayerWeaponStatsCalculator extends AnalyticsCalculator<
  Omit<PlayerWeaponStatsEntity, "statsId">
> {
  private async sharedQuery() {
    return await this.matchOutbound.getAggregatedEvents(
      { matchId: this.matchId },
      [
        KillEvent.query().asKiller(this.playerSteamId).build(),
        KillEvent.query().asVictim(this.playerSteamId).build(),
        PlayerHurtEvent.query().asAttacker(this.playerSteamId).build(),
        WeaponFireEvent.query().asShooter(this.playerSteamId).build(),
      ],
      {
        get: () =>
          this.dbCache.get("sharedQuery") as [
            KillEvent[],
            KillEvent[],
            PlayerHurtEvent[],
            WeaponFireEvent[],
          ],
        set: (events) => this.dbCache.set("sharedQuery", events),
      },
    );
  }

  override async calculate(): Promise<Omit<PlayerWeaponStatsEntity, "statsId">> {
    await this.sharedQuery(); // pre-cache

    const weapons = await this.getWeaponStats();

    return {
      _analyticsType: "weaponStats",
      weapons,
      dateRecorded: new Date(),
    };
  }

  async getWeaponStats(): Promise<WeaponStatsEntry[]> {
    const [killEvents, deathEvents, hurtEvents, fireEvents] =
      await this.sharedQuery();

    const allWeaponNames = new Set<string>([
      ...killEvents.map((e) => e.weapon),
      ...deathEvents.map((e) => e.weapon),
      ...hurtEvents.map((e) => e.weapon),
      ...fireEvents.map((e) => e.weapon),
    ]);

    const killsByWeapon = Object.groupBy(killEvents, (e) => e.weapon);
    const deathsByWeapon = Object.groupBy(deathEvents, (e) => e.weapon);
    const hurtByWeapon = Object.groupBy(hurtEvents, (e) => e.weapon as string);
    const firesByWeapon = Object.groupBy(fireEvents, (e) => e.weapon);

    return Array.from(allWeaponNames).map((weaponName): WeaponStatsEntry => {
      const kills = killsByWeapon[weaponName];
      const deaths = deathsByWeapon[weaponName];
      const hurts = hurtByWeapon[weaponName];
      const fires = firesByWeapon[weaponName];

      return {
        weaponName,
        kills: kills?.length ?? 0,
        deaths: deaths?.length ?? 0,
        hits: hurts?.length ?? 0,
        shots: fires?.length ?? 0,
        damage:
          hurts?.reduce(
            (sum: number, e: PlayerHurtEvent) =>
              sum + e.healthDamage + e.armorDamage,
            0,
          ) ?? 0,
        headshots: kills?.filter((e) => e.isHeadshot).length ?? 0,
      };
    });
  }

  async getKillsPerWeapon(): Promise<Record<string, number>> {
    const [killEvents] = await this.sharedQuery();
    const grouped = Object.groupBy(killEvents, (e) => e.weapon);
    return Object.fromEntries(
      Object.entries(grouped).map(([weapon, events]) => [
        weapon,
        events?.length ?? 0,
      ]),
    );
  }

  async getDeathsPerWeapon(): Promise<Record<string, number>> {
    const [_, deathEvents] = await this.sharedQuery();
    const grouped = Object.groupBy(deathEvents, (e) => e.weapon);
    return Object.fromEntries(
      Object.entries(grouped).map(([weapon, events]) => [
        weapon,
        events?.length ?? 0,
      ]),
    );
  }

  async getHitsPerWeapon(): Promise<Record<string, number>> {
    const [_, __, hurtEvents] = await this.sharedQuery();
    const grouped = Object.groupBy(hurtEvents, (e) => e.weapon as string);
    return Object.fromEntries(
      Object.entries(grouped).map(([weapon, events]) => [
        weapon,
        events?.length ?? 0,
      ]),
    );
  }

  async getShotsPerWeapon(): Promise<Record<string, number>> {
    const [_, __, ___, fireEvents] = await this.sharedQuery();
    const grouped = Object.groupBy(fireEvents, (e) => e.weapon);
    return Object.fromEntries(
      Object.entries(grouped).map(([weapon, events]) => [
        weapon,
        events?.length ?? 0,
      ]),
    );
  }

  async getDamagePerWeapon(): Promise<Record<string, number>> {
    const [_, __, hurtEvents] = await this.sharedQuery();
    const grouped = Object.groupBy(hurtEvents, (e) => e.weapon as string);
    return Object.fromEntries(
      Object.entries(grouped).map(([weapon, events]) => [
        weapon,
        events?.reduce(
          (sum: number, e: PlayerHurtEvent) =>
            sum + e.healthDamage + e.armorDamage,
          0,
        ) ?? 0,
      ]),
    );
  }

  async getHeadshotsPerWeapon(): Promise<Record<string, number>> {
    const [killEvents] = await this.sharedQuery();
    const headshotKills = killEvents.filter((e) => e.isHeadshot);
    const grouped = Object.groupBy(headshotKills, (e) => e.weapon);
    return Object.fromEntries(
      Object.entries(grouped).map(([weapon, events]) => [
        weapon,
        events?.length ?? 0,
      ]),
    );
  }
}
