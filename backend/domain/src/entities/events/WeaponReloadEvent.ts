import { MatchEvent } from "./MatchEvent.ts";

export class WeaponReloadEvent extends MatchEvent {
  static readonly eventType = "weapon_reload" as const;
  readonly type = WeaponReloadEvent.eventType;

  constructor(
    readonly playerSteamId64: string | null,
    readonly playerName: string | null,
  ) {
    super();
  }

  static is(event: unknown): event is WeaponReloadEvent {
    return event instanceof WeaponReloadEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown>; demoTick: number; gameTick: number }): WeaponReloadEvent {
    const d = raw.data;
    return new WeaponReloadEvent(
      typeof d["player_steam_id_64"] === "string" ? d["player_steam_id_64"] : null,
      typeof d["player_name"] === "string" ? d["player_name"] : null,
    );
  }
}
