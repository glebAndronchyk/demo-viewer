import { MatchEvent } from "./MatchEvent.ts";

export class RoundEndOfficialEvent extends MatchEvent {
  static readonly eventType = "round_end_official" as const;
  readonly type = RoundEndOfficialEvent.eventType;

  static is(event: unknown): event is RoundEndOfficialEvent {
    return event instanceof RoundEndOfficialEvent;
  }

  static fromRaw(_raw: { type: string; data: Record<string, unknown> }): RoundEndOfficialEvent {
    return new RoundEndOfficialEvent();
  }
}
