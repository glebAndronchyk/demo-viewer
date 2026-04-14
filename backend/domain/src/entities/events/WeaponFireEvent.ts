import { type EventConstructor, MatchEvent } from "./MatchEvent.ts";
import type { AnalyticsQueryBuilder } from "./AnalyticsQueryBuilder.ts";

class WeaponFireEventQueryBuild implements AnalyticsQueryBuilder<WeaponFireEvent> {
  private filterObject: Record<string, any> = {};

  asShooter(steamId64: string) {
    this.filterObject = {
      ...this.filterObject,
      shooter_steam_id_64: steamId64,
    };

    return this;
  }

  build(): EventConstructor<WeaponFireEvent> {
    return {
      eventType: WeaponFireEvent.eventType,
      filterObject: this.filterObject,
      is: WeaponFireEvent.is.bind(WeaponFireEvent),
      fromRaw: WeaponFireEvent.fromRaw.bind(WeaponFireEvent),
    };
  }
}

export class WeaponFireEvent extends MatchEvent.withBuilder(
  WeaponFireEventQueryBuild,
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

  static asShooter(steamId64: string): EventConstructor<WeaponFireEvent> {
    return {
      eventType: WeaponFireEvent.eventType,
      filterObject: { shooter_steam_id_64: steamId64 },
      is: WeaponFireEvent.is.bind(WeaponFireEvent),
      fromRaw: WeaponFireEvent.fromRaw.bind(WeaponFireEvent),
    };
  }

  static is(event: unknown): event is WeaponFireEvent {
    return event instanceof WeaponFireEvent;
  }

  static fromRaw(raw: {
    type: string;
    data: Record<string, unknown>;
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
