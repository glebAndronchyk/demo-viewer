import { MatchEvent } from "./MatchEvent.ts";

export class WeaponFireEvent extends MatchEvent {
  static readonly eventType = "weapon_fire" as const;
  readonly type = WeaponFireEvent.eventType;

  constructor(
    readonly shooterSteamId64: string | null,
    readonly shooterName: string | null,
    readonly weapon: string,
  ) {
    super();
  }

  static is(event: unknown): event is WeaponFireEvent {
    return event instanceof WeaponFireEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown> }): WeaponFireEvent {
    const d = raw.data;
    return new WeaponFireEvent(
      typeof d["shooter_steam_id_64"] === "string" ? d["shooter_steam_id_64"] : null,
      typeof d["shooter_name"] === "string" ? d["shooter_name"] : null,
      typeof d["weapon"] === "string" ? d["weapon"] : "",
    );
  }
}
