import { type EventConstructor, MatchEvent } from "./MatchEvent.ts";

export interface AnalyticsQueryBuilder<T extends MatchEvent> {
  build(): EventConstructor<T>;
}
