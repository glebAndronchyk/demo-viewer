import { MatchEvent } from "./MatchEvent.ts";

export class GrenadeDestroyEvent extends MatchEvent {
  static readonly eventType = "grenade_destroy" as const;
  readonly type = GrenadeDestroyEvent.eventType;

  constructor(
    readonly throwerSteamId64: string | null,
    readonly throwerName: string | null,
    readonly weapon: string,
  ) {
    super();
  }

  static is(event: unknown): event is GrenadeDestroyEvent {
    return event instanceof GrenadeDestroyEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown> }): GrenadeDestroyEvent {
    const d = raw.data;
    return new GrenadeDestroyEvent(
      typeof d["thrower_steam_id_64"] === "string" ? d["thrower_steam_id_64"] : null,
      typeof d["thrower_name"] === "string" ? d["thrower_name"] : null,
      typeof d["weapon"] === "string" ? d["weapon"] : "",
    );
  }
}
