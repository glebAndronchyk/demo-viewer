import { MatchEvent } from "./MatchEvent.ts";
import type { WeaponType } from "../WeaponType.ts";
import { type HitGroup, parseHitGroup } from "../HitGroup.ts";
import { AnalyticsQueryBuilder } from "./AnalyticsQueryBuilder.ts";

class PlayerHurtEventQueryBuilder extends AnalyticsQueryBuilder<PlayerHurtEvent> {
  constructor() { super(PlayerHurtEvent); }

  asAttacker(steamId64: string) {
    this.filterObject = { ...this.filterObject, attacker_steam_id_64: steamId64 };
    return this;
  }

  withWeaponInRange(weapons: WeaponType[]) {
    this.filterObject = { ...this.filterObject, weapon: { $in: weapons } };
    return this;
  }
}

export class PlayerHurtEvent extends MatchEvent.withBuilder(
  PlayerHurtEventQueryBuilder,
) {
  static readonly eventType = "player_hurt" as const;
  readonly type = PlayerHurtEvent.eventType;

  constructor(
    readonly playerSteamId64: string | null,
    readonly playerName: string | null,
    readonly attackerSteamId64: string | null,
    readonly attackerName: string | null,
    readonly healthDamage: number,
    readonly armorDamage: number,
    readonly weapon: WeaponType,
    readonly hitGroup: HitGroup,
  ) {
    super();
  }

  static is(event: unknown): event is PlayerHurtEvent {
    return event instanceof PlayerHurtEvent;
  }

  static fromRaw(raw: {
    type: string;
    data: Record<string, unknown>;
    demoTick: number;
    gameTick: number;
  }): PlayerHurtEvent {
    const d = raw.data;
    return new PlayerHurtEvent(
      typeof d["player_steam_id_64"] === "string"
        ? d["player_steam_id_64"]
        : null,
      typeof d["player_name"] === "string" ? d["player_name"] : null,
      typeof d["attacker_steam_id_64"] === "string"
        ? d["attacker_steam_id_64"]
        : null,
      typeof d["attacker_name"] === "string" ? d["attacker_name"] : null,
      typeof d["health_damage"] === "number" ? d["health_damage"] : 0,
      typeof d["armor_damage"] === "number" ? d["armor_damage"] : 0,
      (typeof d["weapon"] === "string" ? d["weapon"] : "") as WeaponType,
      parseHitGroup(typeof d["hit_group"] === "string" ? d["hit_group"] : ""),
    );
  }
}
