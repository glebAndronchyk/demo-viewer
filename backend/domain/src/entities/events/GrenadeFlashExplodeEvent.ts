import { type EventConstructor, MatchEvent } from "./MatchEvent.ts";
import type { AnalyticsQueryBuilder } from "./AnalyticsQueryBuilder.ts";

class GrenadeFlashExplodeEventQueryBuilder implements AnalyticsQueryBuilder<GrenadeFlashExplodeEvent> {
  private filterObject: Record<string, any> = {};

  asThrower(steamId64: string) {
    this.filterObject = {
      ...this.filterObject,
      thrower_steam_id_64: steamId64,
    };
    return this;
  }

  build(): EventConstructor<GrenadeFlashExplodeEvent> {
    return {
      eventType: GrenadeFlashExplodeEvent.eventType,
      filterObject: this.filterObject,
      is: GrenadeFlashExplodeEvent.is.bind(GrenadeFlashExplodeEvent),
      fromRaw: GrenadeFlashExplodeEvent.fromRaw.bind(GrenadeFlashExplodeEvent),
    };
  }
}

export class GrenadeFlashExplodeEvent extends MatchEvent.withBuilder(GrenadeFlashExplodeEventQueryBuilder) {
  static readonly eventType = "grenade_flash_explode" as const;
  readonly type = GrenadeFlashExplodeEvent.eventType;

  constructor(
    readonly throwerSteamId64: string | null,
    readonly throwerName: string | null,
    readonly grenadeType: string,
    readonly grenadeEntityId: number,
    readonly grenadePosition: { x: number; y: number; z: number },
  ) {
    super();
  }

  static is(event: unknown): event is GrenadeFlashExplodeEvent {
    return event instanceof GrenadeFlashExplodeEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown> }): GrenadeFlashExplodeEvent {
    const d = raw.data;
    const pos = (d["grenade_position"] ?? {}) as Record<string, unknown>;
    return new GrenadeFlashExplodeEvent(
      typeof d["thrower_steam_id_64"] === "string" ? d["thrower_steam_id_64"] : null,
      typeof d["thrower_name"] === "string" ? d["thrower_name"] : null,
      typeof d["grenade_type"] === "string" ? d["grenade_type"] : "",
      typeof d["grenade_entity_id"] === "number" ? d["grenade_entity_id"] : 0,
      {
        x: typeof pos["x"] === "number" ? pos["x"] : 0,
        y: typeof pos["y"] === "number" ? pos["y"] : 0,
        z: typeof pos["z"] === "number" ? pos["z"] : 0,
      },
    );
  }
}
