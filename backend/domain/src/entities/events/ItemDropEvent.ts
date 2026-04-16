import { MatchEvent } from "./MatchEvent.ts";
import { AnalyticsQueryBuilder } from "./AnalyticsQueryBuilder.ts";

class ItemDropEventQueryBuilder extends AnalyticsQueryBuilder<ItemDropEvent> {
  constructor() { super(ItemDropEvent); }

  asPlayer(steamId64: string) {
    this.filterObject["player_steam_id_64"] = steamId64;
    return this;
  }
}

export class ItemDropEvent extends MatchEvent.withBuilder(ItemDropEventQueryBuilder) {
  static readonly eventType = "item_drop" as const;
  readonly type = ItemDropEvent.eventType;

  constructor(
    readonly playerSteamId64: string | null,
    readonly playerName: string | null,
    readonly weapon: string,
    readonly weaponEntityId: string | null,
    readonly demoTick: number,
    readonly gameTick: number,
  ) {
    super();
  }

  static is(event: unknown): event is ItemDropEvent {
    return event instanceof ItemDropEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown>; demoTick: number; gameTick: number }): ItemDropEvent {
    const d = raw.data;
    return new ItemDropEvent(
      typeof d["player_steam_id_64"] === "string" ? d["player_steam_id_64"] : null,
      typeof d["player_name"] === "string" ? d["player_name"] : null,
      typeof d["weapon"] === "string" ? d["weapon"] : "",
      typeof d["weapon_entity_id"] === "string" ? d["weapon_entity_id"] : null,
      raw.demoTick,
      raw.gameTick,
    );
  }
}
