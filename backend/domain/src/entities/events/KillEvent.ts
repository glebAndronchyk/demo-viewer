import { MatchEvent, type EventConstructor } from "./MatchEvent.ts";

export class KillEvent extends MatchEvent {
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

  static asKiller(steamId64: string): EventConstructor<KillEvent> {
    return {
      eventType: KillEvent.eventType,
      filterObject: { killer_steam_id_64: steamId64 },
      is: KillEvent.is.bind(KillEvent),
      fromRaw: KillEvent.fromRaw.bind(KillEvent),
    };
  }

  static asVictim(steamId64: string): EventConstructor<KillEvent> {
    return {
      eventType: KillEvent.eventType,
      filterObject: { victim_steam_id_64: steamId64 },
      is: KillEvent.is.bind(KillEvent),
      fromRaw: KillEvent.fromRaw.bind(KillEvent),
    };
  }

  static asAssister(steamId64: string): EventConstructor<KillEvent> {
    return {
      eventType: KillEvent.eventType,
      filterObject: { assister_steam_id_64: steamId64 },
      is: KillEvent.is.bind(KillEvent),
      fromRaw: KillEvent.fromRaw.bind(KillEvent),
    };
  }

  static fromRaw(raw: {
    type: string;
    data: Record<string, unknown>;
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
