import { MatchEvent } from "./MatchEvent.ts";

export class ItemPickupEvent extends MatchEvent {
  static readonly eventType = "item_pickup" as const;
  readonly type = ItemPickupEvent.eventType;

  constructor(
    readonly playerSteamId64: string | null,
    readonly playerName: string | null,
    readonly weapon: string,
  ) {
    super();
  }

  static is(event: unknown): event is ItemPickupEvent {
    return event instanceof ItemPickupEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown> }): ItemPickupEvent {
    const d = raw.data;
    return new ItemPickupEvent(
      typeof d["player_steam_id_64"] === "string" ? d["player_steam_id_64"] : null,
      typeof d["player_name"] === "string" ? d["player_name"] : null,
      typeof d["weapon"] === "string" ? d["weapon"] : "",
    );
  }
}
