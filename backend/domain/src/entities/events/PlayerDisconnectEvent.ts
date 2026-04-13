import { MatchEvent } from "./MatchEvent.ts";

export class PlayerDisconnectEvent extends MatchEvent {
  static readonly eventType = "player_disconnect" as const;
  readonly type = PlayerDisconnectEvent.eventType;

  constructor(
    readonly steamId64: string,
    readonly name: string,
  ) {
    super();
  }

  static is(event: unknown): event is PlayerDisconnectEvent {
    return event instanceof PlayerDisconnectEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown> }): PlayerDisconnectEvent {
    const d = raw.data;
    return new PlayerDisconnectEvent(
      typeof d["steam_id_64"] === "string" ? d["steam_id_64"] : "",
      typeof d["name"] === "string" ? d["name"] : "",
    );
  }
}
