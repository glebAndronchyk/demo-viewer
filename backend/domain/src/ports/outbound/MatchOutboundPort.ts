import type { MatchEntity, RoundInfo } from "../../entities/MatchEntity.ts";
import type {
  DemoChunkEntity,
  DemoEvent,
  Frame,
  PlayerState,
} from "../../entities/DemoChunkEntity.ts";
import type {
  MatchEvent,
  EventConstructor,
  EventsFromConstructors,
} from "../../entities/events/MatchEvent.ts";
import type { PlayerStatsEntity } from "../../entities/PlayerStatsEntity.ts";
import type { PlayerAnalyticalEntity } from "../../entities/PlayerAnalyticalEntity.ts";
import type { PlayerWeaponsUsageEntity } from "../../entities/PlayerWeaponsUsageEntity.ts";
import type { PlayerWeaponStatsEntity } from "../../entities/PlayerWeaponStatsEntity.ts";
import type { PlayerUtilityEntity } from "../../entities/PlayerUtilityEntity.ts";
import type { PlayerEconomyEntity } from "../../entities/PlayerEconomyEntity.ts";
import type { PlayerAccuracyEntity } from "../../entities/PlayerAccuracyEntity.ts";
import type { PlayerClutchesEntity } from "../../entities/PlayerClutchesEntity.ts";

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
    matchId: string;
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

  getFirstGameTickOfEveryRound(matchId: string): Promise<Frame[]>;

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

  getRoundInfoByFrame(matchId: string, frame: Frame): Promise<RoundInfo | null>;

  savePlayerAnalyticalData(
    rootCollection: PlayerStatsEntity,
    subCollections: PlayerAnalyticalEntity[],
  ): Promise<{ rootCollectionId: string }>;

  getMatchesPerStep(offset: number, limit: number): Promise<MatchEntity[]>;

  getMatchPlayerStats(
    matchId: string,
    steamId: string,
  ): Promise<PlayerStatsEntity | null>;

  getTotalPlayerStats(steamId: string): Promise<PlayerStatsEntity | null>;

  getTransientEventsAtTick(
    matchId: string,
    gameTick: number,
    lookbackTicks: number,
  ): Promise<DemoEvent[]>;

  getMatches(
    skip: number,
    take: number,
    steamIds?: string[],
  ): Promise<MatchEntity[]>;

  getTotalMatches(steamIds?: string[]): Promise<number>;

  aggregateWeaponUsagePct(
    steamId: string,
    startDate: Date,
  ): Promise<PlayerWeaponsUsageEntity>;

  aggregateWeaponStats(
    steamId: string,
    startDate: Date,
  ): Promise<PlayerWeaponStatsEntity>;

  aggregateUtilityUsage(
    steamId: string,
    startDate: Date,
  ): Promise<Omit<PlayerUtilityEntity, "statsId">>;

  aggregateEconomyUsage(
    steamId: string,
    startDate: Date,
  ): Promise<Omit<PlayerEconomyEntity, "statsId">>;

  aggregateAccuracy(
    steamId: string,
    startDate: Date,
  ): Promise<Omit<PlayerAccuracyEntity, "statsId">>;

  aggregateClutches(
    steamId: string,
    startDate: Date,
  ): Promise<Omit<PlayerClutchesEntity, "statsId">>;

  isMatchWithShareCodeExists(code: string): Promise<boolean>;

  getAnalyzedMatchesFromSet(matches: Set<string>): Promise<Set<string>>;
}
