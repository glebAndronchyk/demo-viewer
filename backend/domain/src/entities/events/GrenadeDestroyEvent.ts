import { type EventConstructor, MatchEvent } from "./MatchEvent.ts";
import type { AnalyticsQueryBuilder } from "./AnalyticsQueryBuilder.ts";

class GrenadeDestroyEventQueryBuilder implements AnalyticsQueryBuilder<GrenadeDestroyEvent> {
  private filterObject: Record<string, any> = {};

  asThrower(steamId64: string) {
    this.filterObject = {
      ...this.filterObject,
      thrower_steam_id_64: steamId64,
    };
    return this;
  }

  build(): EventConstructor<GrenadeDestroyEvent> {
    return {
      eventType: GrenadeDestroyEvent.eventType,
      filterObject: this.filterObject,
      is: GrenadeDestroyEvent.is.bind(GrenadeDestroyEvent),
      fromRaw: GrenadeDestroyEvent.fromRaw.bind(GrenadeDestroyEvent),
    };
  }
}

export class GrenadeDestroyEvent extends MatchEvent.withBuilder(GrenadeDestroyEventQueryBuilder) {
  static readonly eventType = "grenade_destroy" as const;
  readonly type = GrenadeDestroyEvent.eventType;

  constructor(
    readonly throwerSteamId64: string | null,
    readonly throwerName: string | null,
    readonly weapon: string,
    readonly grenadeEntityId: number,
    readonly grenadePosition: { x: number; y: number; z: number },
  ) {
    super();
  }

  static is(event: unknown): event is GrenadeDestroyEvent {
    return event instanceof GrenadeDestroyEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown> }): GrenadeDestroyEvent {
    const d = raw.data;
    const pos = (d["grenade_position"] ?? {}) as Record<string, unknown>;
    return new GrenadeDestroyEvent(
      typeof d["thrower_steam_id_64"] === "string" ? d["thrower_steam_id_64"] : null,
      typeof d["thrower_name"] === "string" ? d["thrower_name"] : null,
      typeof d["weapon"] === "string" ? d["weapon"] : "",
      typeof d["grenade_entity_id"] === "number" ? d["grenade_entity_id"] : 0,
      {
        x: typeof pos["x"] === "number" ? pos["x"] : 0,
        y: typeof pos["y"] === "number" ? pos["y"] : 0,
        z: typeof pos["z"] === "number" ? pos["z"] : 0,
      },
    );
  }
}
