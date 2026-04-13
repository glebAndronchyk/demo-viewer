import { MatchEvent } from "./MatchEvent.ts";

export class PlayerHurtEvent extends MatchEvent {
  static readonly eventType = "player_hurt" as const;
  readonly type = PlayerHurtEvent.eventType;

  constructor(
    readonly playerSteamId64: string | null,
    readonly playerName: string | null,
    readonly attackerSteamId64: string | null,
    readonly attackerName: string | null,
    readonly healthDamage: number,
    readonly armorDamage: number,
    readonly weapon: string,
    readonly hitGroup: string,
  ) {
    super();
  }

  static is(event: unknown): event is PlayerHurtEvent {
    return event instanceof PlayerHurtEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown> }): PlayerHurtEvent {
    const d = raw.data;
    return new PlayerHurtEvent(
      typeof d["player_steam_id_64"] === "string" ? d["player_steam_id_64"] : null,
      typeof d["player_name"] === "string" ? d["player_name"] : null,
      typeof d["attacker_steam_id_64"] === "string" ? d["attacker_steam_id_64"] : null,
      typeof d["attacker_name"] === "string" ? d["attacker_name"] : null,
      typeof d["health_damage"] === "number" ? d["health_damage"] : 0,
      typeof d["armor_damage"] === "number" ? d["armor_damage"] : 0,
      typeof d["weapon"] === "string" ? d["weapon"] : "",
      typeof d["hit_group"] === "string" ? d["hit_group"] : "",
    );
  }
}
