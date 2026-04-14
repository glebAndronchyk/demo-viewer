import type { MatchEntity, RoundInfo } from "../../entities/MatchEntity.ts";
import type {
  DemoChunkEntity,
  PlayerState,
} from "../../entities/DemoChunkEntity.ts";
import type {
  MatchEvent,
  EventConstructor,
  EventsFromConstructors,
} from "../../entities/events/MatchEvent.ts";

export interface AggregatedEventsFilter {
  matchId?: string;
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

  getRoundsPlayedByPlayer(
    matchId: string,
    steamId64: string,
  ): Promise<RoundInfo[]>;

  getPlayerFinalStateForMatch(
    matchId: string,
    steamId64: string,
  ): Promise<PlayerState>;

  getClutchRounds(
    matchId: string,
    steamId64: string,
  ): Promise<
    {
      roundNumber: number;
      vs: number;
      outcome: "lost" | "won";
    }[]
  >;
}
