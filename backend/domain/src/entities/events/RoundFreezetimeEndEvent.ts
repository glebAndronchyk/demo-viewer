import { MatchEvent } from "./MatchEvent.ts";

export class RoundFreezetimeEndEvent extends MatchEvent {
  static readonly eventType = "round_freezetime_end" as const;
  readonly type = RoundFreezetimeEndEvent.eventType;

  static is(event: unknown): event is RoundFreezetimeEndEvent {
    return event instanceof RoundFreezetimeEndEvent;
  }

  static fromRaw(_raw: { type: string; data: Record<string, unknown> }): RoundFreezetimeEndEvent {
    return new RoundFreezetimeEndEvent();
  }
}
