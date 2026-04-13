import { MatchEvent } from "./MatchEvent.ts";

export class HostageRescuedEvent extends MatchEvent {
  static readonly eventType = "hostage_rescued" as const;
  readonly type = HostageRescuedEvent.eventType;

  constructor(
    readonly playerSteamId64: string | null,
    readonly playerName: string | null,
  ) {
    super();
  }

  static is(event: unknown): event is HostageRescuedEvent {
    return event instanceof HostageRescuedEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown> }): HostageRescuedEvent {
    const d = raw.data;
    return new HostageRescuedEvent(
      typeof d["player_steam_id_64"] === "string" ? d["player_steam_id_64"] : null,
      typeof d["player_name"] === "string" ? d["player_name"] : null,
    );
  }
}
