import { MatchEvent } from "./MatchEvent.ts";
import { AnalyticsQueryBuilder } from "./AnalyticsQueryBuilder.ts";

class ItemRefundEventQueryBuilder extends AnalyticsQueryBuilder<ItemRefundEvent> {
  constructor() { super(ItemRefundEvent); }

  asPlayer(steamId64: string) {
    this.filterObject["player_steam_id_64"] = steamId64;
    return this;
  }
}

export class ItemRefundEvent extends MatchEvent.withBuilder(
  ItemRefundEventQueryBuilder,
) {
  static readonly eventType = "item_refund" as const;
  readonly type = ItemRefundEvent.eventType;

  constructor(
    readonly playerSteamId64: string | null,
    readonly playerName: string | null,
    readonly weapon: string,
    readonly demoTick: number,
    readonly gameTick: number,
  ) {
    super();
  }

  static is(event: unknown): event is ItemRefundEvent {
    return event instanceof ItemRefundEvent;
  }

  static fromRaw(raw: {
    type: string;
    data: Record<string, unknown>;
    demoTick: number;
    gameTick: number;
  }): ItemRefundEvent {
    const d = raw.data;
    return new ItemRefundEvent(
      typeof d["player_steam_id_64"] === "string"
        ? d["player_steam_id_64"]
        : null,
      typeof d["player_name"] === "string" ? d["player_name"] : null,
      typeof d["weapon"] === "string" ? d["weapon"] : "",
      raw.demoTick,
      raw.gameTick,
    );
  }
}
