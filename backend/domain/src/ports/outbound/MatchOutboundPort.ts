import type { MatchEntity } from "../../entities/MatchEntity.ts";
import type { DemoChunkEntity } from "../../entities/DemoChunkEntity.ts";
import type {
  MatchEvent,
  EventConstructor,
  EventsFromConstructors,
} from "../../entities/events/MatchEvent.ts";

export interface AggregatedEventsFilter {
  demoId?: DemoChunkEntity["demoId"];
  playerSteamId?: string;
}

export interface EventsCache<
  T extends readonly EventConstructor<MatchEvent>[],
> {
  get: () => EventsFromConstructors<T>;
  set: (items: EventsFromConstructors<T>) => void;
}
export interface MatchOutboundPort {
  findByShareCode(shareCode: string): Promise<{ id: string } | null>;
  findByMatchId(matchId: string): Promise<MatchEntity | null>;
  getTicksRange(payload: {
    step: number;
    startGameTick: number;
    endGameTick: number;
    demoId: string;
  }): Promise<DemoChunkEntity["frames"] | null>;

  getAggregatedEvents<const T extends readonly EventConstructor<MatchEvent>[]>(
    filter: AggregatedEventsFilter,
    eventsToProject: T,
    cache?: EventsCache<T>,
  ): Promise<EventsFromConstructors<T>>;
}
