import { MatchEvent } from "./MatchEvent.ts";
import { AnalyticsQueryBuilder } from "./AnalyticsQueryBuilder.ts";
import type { WeaponType } from "../WeaponType.ts";

class ItemPickupEventQueryBuilder extends AnalyticsQueryBuilder<ItemPickupEvent> {
  constructor() {
    super(ItemPickupEvent);
  }

  forPlayer(steamId64: string) {
    this.filterObject["player_steam_id_64"] = steamId64;
    return this;
  }

  asBought() {
    this.filterObject["is_bought"] = true;
    return this;
  }
}

export class ItemPickupEvent extends MatchEvent.withBuilder(
  ItemPickupEventQueryBuilder,
) {
  static readonly eventType = "item_pickup" as const;
  readonly type = ItemPickupEvent.eventType;

  constructor(
    readonly playerSteamId64: string | null,
    readonly playerName: string | null,
    readonly weapon: WeaponType,
    readonly isBought: boolean,
    readonly weaponEntityId: string | null,
    readonly demoTick: number,
    readonly gameTick: number,
  ) {
    super();
  }

  static is(event: unknown): event is ItemPickupEvent {
    return event instanceof ItemPickupEvent;
  }

  static fromRaw(raw: {
    type: string;
    data: Record<string, unknown>;
    demoTick: number;
    gameTick: number;
  }): ItemPickupEvent {
    const d = raw.data;
    return new ItemPickupEvent(
      typeof d["player_steam_id_64"] === "string"
        ? d["player_steam_id_64"]
        : null,
      typeof d["player_name"] === "string" ? d["player_name"] : null,
      (typeof d["weapon"] === "string" ? d["weapon"] : "") as WeaponType,
      typeof d["is_bought"] === "boolean" ? d["is_bought"] : false,
      typeof d["weapon_entity_id"] === "string" ? d["weapon_entity_id"] : null,
      raw.demoTick,
      raw.gameTick,
    );
  }
}
