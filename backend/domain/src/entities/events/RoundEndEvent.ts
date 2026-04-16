import { MatchEvent } from "./MatchEvent.ts";

export class RoundEndEvent extends MatchEvent {
  static readonly eventType = "round_end" as const;
  readonly type = RoundEndEvent.eventType;

  constructor(
    readonly winner: "T" | "CT" | "Spectators" | "Unknown",
    readonly reason: string,
  ) {
    super();
  }

  static is(event: unknown): event is RoundEndEvent {
    return event instanceof RoundEndEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown>; demoTick: number; gameTick: number }): RoundEndEvent {
    const d = raw.data;
    const rawWinner = d["winner"];
    const winner: "T" | "CT" | "Spectators" | "Unknown" =
      rawWinner === "T" ? "T"
      : rawWinner === "CT" ? "CT"
      : rawWinner === "Spectators" ? "Spectators"
      : "Unknown";
    return new RoundEndEvent(
      winner,
      typeof d["reason"] === "string" ? d["reason"] : "",
    );
  }
}
