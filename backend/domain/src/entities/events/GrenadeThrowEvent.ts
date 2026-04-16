import { MatchEvent } from "./MatchEvent.ts";
import { AnalyticsQueryBuilder } from "./AnalyticsQueryBuilder.ts";
import type { GrenadesWeaponType } from "../WeaponType.ts";

class GrenadeThrowEventQueryBuilder extends AnalyticsQueryBuilder<GrenadeThrowEvent> {
  constructor() { super(GrenadeThrowEvent); }

  asThrower(steamId64: string) {
    this.filterObject = { ...this.filterObject, thrower_steam_id_64: steamId64 };
    return this;
  }
}

export class GrenadeThrowEvent extends MatchEvent.withBuilder(
  GrenadeThrowEventQueryBuilder,
) {
  static readonly eventType = "grenade_throw" as const;
  readonly type = GrenadeThrowEvent.eventType;

  constructor(
    readonly throwerSteamId64: string | null,
    readonly throwerName: string | null,
    readonly weapon: GrenadesWeaponType,
    readonly grenadeEntityId: number,
    readonly grenadePosition: { x: number; y: number; z: number },
  ) {
    super();
  }

  static is(event: unknown): event is GrenadeThrowEvent {
    return event instanceof GrenadeThrowEvent;
  }

  static fromRaw(raw: {
    type: string;
    data: Record<string, unknown>;
    demoTick: number;
    gameTick: number;
  }): GrenadeThrowEvent {
    const d = raw.data;
    const pos = (d["grenade_position"] ?? {}) as Record<string, unknown>;
    return new GrenadeThrowEvent(
      typeof d["thrower_steam_id_64"] === "string"
        ? d["thrower_steam_id_64"]
        : null,
      typeof d["thrower_name"] === "string" ? d["thrower_name"] : null,
      (typeof d["weapon"] === "string"
        ? d["weapon"]
        : "") as GrenadesWeaponType,
      typeof d["grenade_entity_id"] === "number" ? d["grenade_entity_id"] : 0,
      {
        x: typeof pos["x"] === "number" ? pos["x"] : 0,
        y: typeof pos["y"] === "number" ? pos["y"] : 0,
        z: typeof pos["z"] === "number" ? pos["z"] : 0,
      },
    );
  }
}
