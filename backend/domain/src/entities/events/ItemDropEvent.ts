import { MatchEvent } from "./MatchEvent.ts";

export class ItemDropEvent extends MatchEvent {
  static readonly eventType = "item_drop" as const;
  readonly type = ItemDropEvent.eventType;

  constructor(
    readonly playerSteamId64: string | null,
    readonly playerName: string | null,
    readonly weapon: string,
  ) {
    super();
  }

  static is(event: unknown): event is ItemDropEvent {
    return event instanceof ItemDropEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown> }): ItemDropEvent {
    const d = raw.data;
    return new ItemDropEvent(
      typeof d["player_steam_id_64"] === "string" ? d["player_steam_id_64"] : null,
      typeof d["player_name"] === "string" ? d["player_name"] : null,
      typeof d["weapon"] === "string" ? d["weapon"] : "",
    );
  }
}
