import { MatchEvent } from "./MatchEvent.ts";
import { AnalyticsQueryBuilder } from "./AnalyticsQueryBuilder.ts";

class WeaponFireEventQueryBuilder extends AnalyticsQueryBuilder<WeaponFireEvent> {
  constructor() { super(WeaponFireEvent); }

  asShooter(steamId64: string) {
    this.filterObject = { ...this.filterObject, shooter_steam_id_64: steamId64 };
    return this;
  }
}

export class WeaponFireEvent extends MatchEvent.withBuilder(
  WeaponFireEventQueryBuilder,
) {
  static readonly eventType = "weapon_fire" as const;
  readonly type = WeaponFireEvent.eventType;

  constructor(
    readonly shooterSteamId64: string | null,
    readonly shooterName: string | null,
    readonly weapon: string,
  ) {
    super();
  }

  static is(event: unknown): event is WeaponFireEvent {
    return event instanceof WeaponFireEvent;
  }

  static fromRaw(raw: {
    type: string;
    data: Record<string, unknown>;
    demoTick: number;
    gameTick: number;
  }): WeaponFireEvent {
    const d = raw.data;
    return new WeaponFireEvent(
      typeof d["shooter_steam_id_64"] === "string"
        ? d["shooter_steam_id_64"]
        : null,
      typeof d["shooter_name"] === "string" ? d["shooter_name"] : null,
      typeof d["weapon"] === "string" ? d["weapon"] : "",
    );
  }
}
