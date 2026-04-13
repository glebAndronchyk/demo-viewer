import { MatchEvent } from "./MatchEvent.ts";

export class PlayerConnectEvent extends MatchEvent {
  static readonly eventType = "player_connect" as const;
  readonly type = PlayerConnectEvent.eventType;

  constructor(
    readonly steamId64: string,
    readonly name: string,
  ) {
    super();
  }

  static is(event: unknown): event is PlayerConnectEvent {
    return event instanceof PlayerConnectEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown> }): PlayerConnectEvent {
    const d = raw.data;
    return new PlayerConnectEvent(
      typeof d["steam_id_64"] === "string" ? d["steam_id_64"] : "",
      typeof d["name"] === "string" ? d["name"] : "",
    );
  }
}
