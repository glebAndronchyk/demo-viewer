import { type EventConstructor, MatchEvent } from "./MatchEvent.ts";
import type { WeaponType } from "../WeaponType.ts";
import { type HitGroup, parseHitGroup } from "../HitGroup.ts";
import type { AnalyticsQueryBuilder } from "./AnalyticsQueryBuilder.ts";

class PlayerHurtEventQueryBuilder implements AnalyticsQueryBuilder<PlayerHurtEvent> {
  private filterObject: Record<string, any> = {};

  asAttacker(steamId64: string) {
    this.filterObject = {
      ...this.filterObject,
      attacker_steam_id_64: steamId64,
    };

    return this;
  }

  build(): EventConstructor<PlayerHurtEvent> {
    return {
      eventType: PlayerHurtEvent.eventType,
      filterObject: this.filterObject,
      is: PlayerHurtEvent.is.bind(PlayerHurtEvent),
      fromRaw: PlayerHurtEvent.fromRaw.bind(PlayerHurtEvent),
    };
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

  static asAttacker(steamId64: string): EventConstructor<PlayerHurtEvent> {
    return {
      eventType: PlayerHurtEvent.eventType,
      filterObject: { attacker_steam_id_64: steamId64 },
      is: PlayerHurtEvent.is.bind(PlayerHurtEvent),
      fromRaw: PlayerHurtEvent.fromRaw.bind(PlayerHurtEvent),
    };
  }

  static is(event: unknown): event is PlayerHurtEvent {
    return event instanceof PlayerHurtEvent;
  }

  static fromRaw(raw: {
    type: string;
    data: Record<string, unknown>;
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
