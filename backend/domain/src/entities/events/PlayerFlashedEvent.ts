import { MatchEvent, type EventConstructor } from "./MatchEvent.ts";
import type { AnalyticsQueryBuilder } from "./AnalyticsQueryBuilder.ts";
import { GrenadeFlashExplodeEvent } from "./GrenadeFlashExplodeEvent.ts";
import type { HitGroup } from "../HitGroup.ts";
import type { TeamType } from "../TeamType.ts";

class PlayerFlashedEventQueryBuilder implements AnalyticsQueryBuilder<PlayerFlashedEvent> {
  private filterObject: Record<string, any> = {};

  asAttacker(steamId64: string) {
    this.filterObject = {
      ...this.filterObject,
      attacker_steam_id_64: steamId64,
    };
    return this;
  }

  withTargetPlayerTeam(team: TeamType) {
    this.filterObject = { ...this.filterObject, player_team: team };
    return this;
  }

  build(): EventConstructor<PlayerFlashedEvent> {
    return {
      eventType: PlayerFlashedEvent.eventType,
      filterObject: this.filterObject,
      is: PlayerFlashedEvent.is.bind(PlayerFlashedEvent),
      fromRaw: PlayerFlashedEvent.fromRaw.bind(PlayerFlashedEvent),
    };
  }
}

export class PlayerFlashedEvent extends MatchEvent.withBuilder(
  PlayerFlashedEventQueryBuilder,
) {
  static readonly eventType = "player_flashed" as const;
  readonly type = PlayerFlashedEvent.eventType;

  constructor(
    readonly playerSteamId64: string | null,
    readonly playerName: string | null,
    readonly attackerSteamId64: string | null,
    readonly attackerName: string | null,
    readonly flashDuration: number | null,
    readonly attackerTeam: TeamType | null,
    readonly playerTeam: TeamType | null,
  ) {
    super();
  }

  static is(event: unknown): event is PlayerFlashedEvent {
    return event instanceof PlayerFlashedEvent;
  }

  static fromRaw(raw: {
    type: string;
    data: Record<string, unknown>;
  }): PlayerFlashedEvent {
    const d = raw.data;
    return new PlayerFlashedEvent(
      typeof d["player_steam_id_64"] === "string"
        ? d["player_steam_id_64"]
        : null,
      typeof d["player_name"] === "string" ? d["player_name"] : null,
      typeof d["attacker_steam_id_64"] === "string"
        ? d["attacker_steam_id_64"]
        : null,
      typeof d["attacker_steam_id_64"] === "string"
        ? d["attacker_steam_id_64"]
        : null,
      typeof d["flash_duration"] === "number" ? d["flash_duration"] : null,
      typeof (d["player_team"] === "string"
        ? d["player_team"]
        : null) as TeamType,
      typeof (d["attacker_team"] === "string"
        ? d["attacker_team"]
        : null) as TeamType,
    );
  }
}
