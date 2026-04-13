import { MatchEvent } from "./MatchEvent.ts";

export class GrenadeThrowEvent extends MatchEvent {
  static readonly eventType = "grenade_throw" as const;
  readonly type = GrenadeThrowEvent.eventType;

  constructor(
    readonly throwerSteamId64: string | null,
    readonly throwerName: string | null,
    readonly weapon: string,
  ) {
    super();
  }

  static is(event: unknown): event is GrenadeThrowEvent {
    return event instanceof GrenadeThrowEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown> }): GrenadeThrowEvent {
    const d = raw.data;
    return new GrenadeThrowEvent(
      typeof d["thrower_steam_id_64"] === "string" ? d["thrower_steam_id_64"] : null,
      typeof d["thrower_name"] === "string" ? d["thrower_name"] : null,
      typeof d["weapon"] === "string" ? d["weapon"] : "",
    );
  }
}
