import { MatchEvent } from "./MatchEvent.ts";

export class BombExplodedEvent extends MatchEvent {
  static readonly eventType = "bomb_exploded" as const;
  readonly type = BombExplodedEvent.eventType;

  constructor(
    readonly site: "A" | "B" | "Unknown",
  ) {
    super();
  }

  static is(event: unknown): event is BombExplodedEvent {
    return event instanceof BombExplodedEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown> }): BombExplodedEvent {
    const d = raw.data;
    const rawSite = d["site"];
    const site: "A" | "B" | "Unknown" =
      rawSite === "A" ? "A" : rawSite === "B" ? "B" : "Unknown";
    return new BombExplodedEvent(site);
  }
}
