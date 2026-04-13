import { MatchEvent } from "./MatchEvent.ts";

export class PlayerFlashedEvent extends MatchEvent {
  static readonly eventType = "player_flashed" as const;
  readonly type = PlayerFlashedEvent.eventType;

  constructor(
    readonly playerSteamId64: string | null,
    readonly playerName: string | null,
    readonly attackerSteamId64: string | null,
    readonly attackerName: string | null,
  ) {
    super();
  }

  static is(event: unknown): event is PlayerFlashedEvent {
    return event instanceof PlayerFlashedEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown> }): PlayerFlashedEvent {
    const d = raw.data;
    return new PlayerFlashedEvent(
      typeof d["player_steam_id_64"] === "string" ? d["player_steam_id_64"] : null,
      typeof d["player_name"] === "string" ? d["player_name"] : null,
      typeof d["attacker_steam_id_64"] === "string" ? d["attacker_steam_id_64"] : null,
      typeof d["attacker_name"] === "string" ? d["attacker_name"] : null,
    );
  }
}
