import { MatchEvent } from "./MatchEvent.ts";

export class RoundStartEvent extends MatchEvent {
  static readonly eventType = "round_start" as const;
  readonly type = RoundStartEvent.eventType;

  constructor(
    readonly timeLimit: number,
    readonly fragLimit: number,
    readonly objective: string,
  ) {
    super();
  }

  static is(event: unknown): event is RoundStartEvent {
    return event instanceof RoundStartEvent;
  }

  static fromRaw(raw: { type: string; data: Record<string, unknown>; demoTick: number; gameTick: number }): RoundStartEvent {
    const d = raw.data;
    return new RoundStartEvent(
      typeof d["time_limit"] === "number" ? d["time_limit"] : 0,
      typeof d["frag_limit"] === "number" ? d["frag_limit"] : 0,
      typeof d["objective"] === "string" ? d["objective"] : "",
    );
  }
}
