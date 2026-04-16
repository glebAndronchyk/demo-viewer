import { MatchEvent } from "./MatchEvent.ts";

export class BombDefusedEvent extends MatchEvent {
  static readonly eventType = "bomb_defused" as const;
  readonly type = BombDefusedEvent.eventType;

  constructor(
    readonly playerSteamId64: string | null,
    readonly playerName: string | null,
  ) {
    super();
  }

  static is(event: unknown): event is BombDefusedEvent {
    return event instanceof BombDefusedEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown>; demoTick: number; gameTick: number }): BombDefusedEvent {
    const d = raw.data;
    return new BombDefusedEvent(
      typeof d["player_steam_id_64"] === "string" ? d["player_steam_id_64"] : null,
      typeof d["player_name"] === "string" ? d["player_name"] : null,
    );
  }
}
