import { MatchEvent } from "./MatchEvent.ts";

export class BombPlantedEvent extends MatchEvent {
  static readonly eventType = "bomb_planted" as const;
  readonly type = BombPlantedEvent.eventType;

  constructor(
    readonly playerSteamId64: string | null,
    readonly playerName: string | null,
    readonly site: "A" | "B" | "Unknown",
  ) {
    super();
  }

  static is(event: unknown): event is BombPlantedEvent {
    return event instanceof BombPlantedEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown>; demoTick: number; gameTick: number }): BombPlantedEvent {
    const d = raw.data;
    const rawSite = d["site"];
    const site: "A" | "B" | "Unknown" =
      rawSite === "A" ? "A" : rawSite === "B" ? "B" : "Unknown";
    return new BombPlantedEvent(
      typeof d["player_steam_id_64"] === "string" ? d["player_steam_id_64"] : null,
      typeof d["player_name"] === "string" ? d["player_name"] : null,
      site,
    );
  }
}
