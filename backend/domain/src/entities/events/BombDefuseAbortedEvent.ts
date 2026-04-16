import { MatchEvent } from "./MatchEvent.ts";

export class BombDefuseAbortedEvent extends MatchEvent {
  static readonly eventType = "bomb_defuse_aborted" as const;
  readonly type = BombDefuseAbortedEvent.eventType;

  constructor(
    readonly playerSteamId64: string | null,
    readonly playerName: string | null,
  ) {
    super();
  }

  static is(event: unknown): event is BombDefuseAbortedEvent {
    return event instanceof BombDefuseAbortedEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown>; demoTick: number; gameTick: number }): BombDefuseAbortedEvent {
    const d = raw.data;
    return new BombDefuseAbortedEvent(
      typeof d["player_steam_id_64"] === "string" ? d["player_steam_id_64"] : null,
      typeof d["player_name"] === "string" ? d["player_name"] : null,
    );
  }
}
