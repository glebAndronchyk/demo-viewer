import { AnalyticsCalculator } from "./types/AnalyticsCalculator.ts";
import type { PlayerUtilityEntity } from "../../entities/PlayerUtilityEntity.ts";
import {
  GrenadeThrowEvent,
  PlayerFlashedEvent,
  PlayerHurtEvent,
} from "../../entities/events";
import { Weapon, type WeaponType } from "../../entities/WeaponType.ts";

export class MatchPlayerUtilityUsageCalculator extends AnalyticsCalculator<
  Omit<PlayerUtilityEntity, "statsId">
> {
  private async sharedQuery() {
    return await this.matchOutbound.getAggregatedEvents(
      {
        matchId: this.matchId,
      },
      [
        PlayerFlashedEvent.query().asAttacker(this.playerSteamId).build(),
        GrenadeThrowEvent.query().asThrower(this.playerSteamId).build(),
        PlayerHurtEvent.query().withWeaponInRange(Weapon.grenades).build(),
      ],
      {
        get: () =>
          this.dbCache.get("sharedQuery") as [
            PlayerFlashedEvent[],
            GrenadeThrowEvent[],
            PlayerHurtEvent[],
          ],
        set: (val) => this.dbCache.set("sharedQuery", val),
      },
    );
  }

  override async calculate(): Promise<Omit<PlayerUtilityEntity, "statsId">> {
    await this.sharedQuery(); // pre-cache

    const [
      grenadesThrown,
      heThrown,
      smokesThrown,
      molotovsThrown,
      flashesThrown,
      incendiariesThrown,
      teammatesFlashed,
      enemiesFlashed,
      molotovsDamage,
      heDamage,
      flashDuration,
    ] = await Promise.all([
      this.getTotalGrenadesThrown().catch(() => 0),
      this.getTotalHeThrown().catch(() => 0),
      this.getTotalSmokesThrown().catch(() => 0),
      this.getTotalMolotovsThrown().catch(() => 0),
      this.getTotalFlashesThrown().catch(() => 0),
      this.getTotalIncendiariesThrown().catch(() => 0),
      this.getTotalTeammatesFlashed().catch(() => 0),
      this.getTotalEnemiesFlashed().catch(() => 0),
      this.getTotalMolotovsDamage().catch(() => 0),
      this.getHeDamage().catch(() => 0),
      this.getFlashDuration().catch(() => 0),
    ]);

    return {
      _analyticsType: "utility",
      grenadesThrown,
      heThrown,
      smokesThrown,
      molotovsThrown,
      flashesThrown,
      incendiariesThrown,
      teammatesFlashed,
      enemiesFlashed,
      molotovsDamage,
      heDamage,
      flashDuration,
      dateRecorded: new Date(),
    };
  }

  async getTotalGrenadesThrown() {
    const [_, thrownGrenades] = await this.sharedQuery();

    return thrownGrenades.length;
  }

  async getTotalHeThrown() {
    const [_, thrownGrenades] = await this.sharedQuery();

    return thrownGrenades.filter((g) => g.weapon === "HE Grenade").length;
  }

  async getTotalSmokesThrown() {
    const [_, thrownGrenades] = await this.sharedQuery();

    return thrownGrenades.filter((g) => g.weapon === "Smoke Grenade").length;
  }

  async getTotalMolotovsThrown() {
    const [_, thrownGrenades] = await this.sharedQuery();

    return thrownGrenades.filter((g) => g.weapon === "Molotov").length;
  }

  async getTotalFlashesThrown() {
    const [_, thrownGrenades] = await this.sharedQuery();

    return thrownGrenades.filter((g) => g.weapon === "Flashbang").length;
  }

  async getTotalIncendiariesThrown() {
    const [_, thrownGrenades] = await this.sharedQuery();

    return thrownGrenades.filter((g) => g.weapon === "Incendiary Grenade")
      .length;
  }

  async getTotalTeammatesFlashed() {
    const [flashedPlayers] = await this.sharedQuery();

    return flashedPlayers.filter((g) => g.attackerTeam === g.playerTeam).length;
  }

  async getTotalEnemiesFlashed() {
    const [flashedPlayers] = await this.sharedQuery();

    return flashedPlayers.filter((g) => g.attackerTeam !== g.playerTeam).length;
  }

  async getTotalMolotovsDamage() {
    const [_, __, hurtEvents] = await this.sharedQuery();

    return hurtEvents
      .filter((g) =>
        (["Molotov", "Incendiary Grenade"] as WeaponType[]).includes(g.weapon),
      )
      .reduce((sum, e) => sum + e.healthDamage + e.armorDamage, 0);
  }

  async getHeDamage() {
    const [_, __, hurtEvents] = await this.sharedQuery();

    return hurtEvents
      .filter((g) => (["HE Grenade"] as WeaponType[]).includes(g.weapon))
      .reduce((sum, e) => sum + e.healthDamage + e.armorDamage, 0);
  }

  async getFlashDuration() {
    const [flashedPlayers] = await this.sharedQuery();

    return flashedPlayers
      .filter((g) => g.attackerTeam !== g.playerTeam)
      .reduce((acc, curr) => {
        return acc + (curr.flashDuration ?? 0);
      }, 0);
  }
}
