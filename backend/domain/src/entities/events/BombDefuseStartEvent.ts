import { MatchEvent } from "./MatchEvent.ts";

export class BombDefuseStartEvent extends MatchEvent {
  static readonly eventType = "bomb_defuse_start" as const;
  readonly type = BombDefuseStartEvent.eventType;

  constructor(
    readonly playerSteamId64: string | null,
    readonly playerName: string | null,
    readonly hasKit: boolean,
  ) {
    super();
  }

  static is(event: unknown): event is BombDefuseStartEvent {
    return event instanceof BombDefuseStartEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown>; demoTick: number; gameTick: number }): BombDefuseStartEvent {
    const d = raw.data;
    return new BombDefuseStartEvent(
      typeof d["player_steam_id_64"] === "string" ? d["player_steam_id_64"] : null,
      typeof d["player_name"] === "string" ? d["player_name"] : null,
      d["has_kit"] === true,
    );
  }
}
