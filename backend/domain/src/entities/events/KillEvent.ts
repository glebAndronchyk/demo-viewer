import { AnalyticsQueryBuilder } from "./AnalyticsQueryBuilder.ts";
import { MatchEvent } from "./MatchEvent.ts";

class KillEventQueryBuilder extends AnalyticsQueryBuilder<KillEvent> {
  constructor() { super(KillEvent); }

  asKiller(steamId64: string) {
    this.filterObject = { ...this.filterObject, killer_steam_id_64: steamId64 };
    return this;
  }

  asHeadshot() {
    this.filterObject = { ...this.filterObject, headshot: true };
    return this;
  }

  asVictim(steamId64: string) {
    this.filterObject = { ...this.filterObject, victim_steam_id_64: steamId64 };
    return this;
  }

  asAssister(steamId64: string) {
    this.filterObject = { ...this.filterObject, assister_steam_id_64: steamId64 };
    return this;
  }
}

export class KillEvent extends MatchEvent.withBuilder(KillEventQueryBuilder) {
  static readonly eventType = "kill" as const;
  readonly type = KillEvent.eventType;

  constructor(
    readonly killerSteamId64: string | null,
    readonly killerName: string | null,
    readonly victimSteamId64: string,
    readonly victimName: string,
    readonly assisterSteamId64: string | null,
    readonly assisterName: string | null,
    readonly weapon: string,
    readonly isHeadshot: boolean,
    readonly penetratedObjects: number,
  ) {
    super();
  }

  static is(event: unknown): event is KillEvent {
    return event instanceof KillEvent;
  }

  static fromRaw(raw: {
    type: string;
    data: Record<string, unknown>;
    demoTick: number;
    gameTick: number;
  }): KillEvent {
    const d = raw.data;
    return new KillEvent(
      typeof d["killer_steam_id_64"] === "string"
        ? d["killer_steam_id_64"]
        : null,
      typeof d["killer_name"] === "string" ? d["killer_name"] : null,
      typeof d["victim_steam_id_64"] === "string"
        ? d["victim_steam_id_64"]
        : "",
      typeof d["victim_name"] === "string" ? d["victim_name"] : "",
      typeof d["assister_steam_id_64"] === "string"
        ? d["assister_steam_id_64"]
        : null,
      typeof d["assister_name"] === "string" ? d["assister_name"] : null,
      typeof d["weapon"] === "string" ? d["weapon"] : "",
      d["is_headshot"] === true,
      typeof d["penetrated_objects"] === "number" ? d["penetrated_objects"] : 0,
    );
  }
}
