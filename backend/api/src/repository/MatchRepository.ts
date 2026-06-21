import {
  MatchOutboundPort,
  AggregatedEventsFilter,
  EventsCache,
} from "@demo-viewer/domain/src/ports/outbound/MatchOutboundPort";
import {
  MatchEntity,
  RoundInfo,
} from "@demo-viewer/domain/src/entities/MatchEntity";
import { DatabaseService } from "../adapters/DatabaseService";
import { toMatchEntity } from "../mappers/match.mapper";
import {
  DemoChunkEntity,
  DemoEvent,
  Frame,
  PlayerState,
} from "@demo-viewer/domain/src/entities/DemoChunkEntity";
import {
  IDemoChunkDocument,
  IFrame,
  IPlayerState,
} from "@demo-viewer/database/dist/types/demo_chunk.types";
import { toDemoChunkFrame } from "../mappers/demo-chunk-frame.mapper";
import type {
  EventConstructor,
  EventsFromConstructors,
} from "@demo-viewer/domain/src/entities/events/MatchEvent";
import type { MatchEvent } from "@demo-viewer/domain/src/entities/events/MatchEvent";
import { NotFoundError } from "elysia";
import { toPlayerStateEntity } from "../mappers/player-state.mapper";
import { PlayerAnalyticalEntity } from "@demo-viewer/domain/src/entities/PlayerAnalyticalEntity";
import { PlayerStatsEntity } from "@demo-viewer/domain/src/entities/PlayerStatsEntity";
import type { PlayerClutchesEntity } from "@demo-viewer/domain/src/entities/PlayerClutchesEntity";
import type { PlayerEconomyEntity } from "@demo-viewer/domain/src/entities/PlayerEconomyEntity";
import type { PlayerUtilityEntity } from "@demo-viewer/domain/src/entities/PlayerUtilityEntity";
import type { PlayerWeaponsUsageEntity } from "@demo-viewer/domain/src/entities/PlayerWeaponsUsageEntity";
import type { PlayerWeaponStatsEntity } from "@demo-viewer/domain/src/entities/PlayerWeaponStatsEntity";
import {
  toPlayerStatsEntity,
  toPlayerStatsModel,
} from "../mappers/player-stats.mapper";
import { toPlayerAccuracyEntity } from "../mappers/player-accuracy.mapper";
import {
  toPlayerAccuracyModel,
  toPlayerClutchesModel,
  toPlayerEconomyEntity,
  toPlayerEconomyModel,
  toPlayerUtilityEntity,
  toPlayerUtilityModel,
  toPlayerWeaponStatsEntity,
  toPlayerWeaponsUsageEntity,
  toPlayerWeaponsUsageModel,
  toWeaponStatsModels,
} from "../mappers/player-analytics.mapper";
import { detectClutchRounds, type RawClutchRound } from "./detectClutchRounds";
import { PlayerAccuracyEntity } from "@demo-viewer/domain/src/entities/PlayerAccuracyEntity";
import { MemoryCache, MemoryCacheAccessor } from "@demo-viewer/backend-shared";
import {
  IPlayerWeaponsUsage,
  IWeaponStats,
} from "@demo-viewer/database/dist/types/weapon.types.ts";
import {
  IPlayerAccuracy,
  IPlayerUtility,
} from "@demo-viewer/database/src/types/performance.types.ts";
import {
  IPlayerClutches,
  IPlayerEconomy,
} from "@demo-viewer/database/src/types/round_outcome.types.ts";
import { PipelineStage, Types } from "mongoose";
import { toPlayerClutchesEntity } from "../mappers/player-clutches.mapper.ts";

export { detectClutchRounds };

export class MatchRepository implements MatchOutboundPort {
  private readonly totalStatsCache: MemoryCacheAccessor<
    string,
    PlayerStatsEntity
  >;
  private readonly weaponsCache: MemoryCacheAccessor<
    string,
    | PlayerWeaponsUsageEntity
    | PlayerWeaponStatsEntity
    | Omit<PlayerUtilityEntity, "statsId">
    | Omit<PlayerEconomyEntity, "statsId">
    | Omit<PlayerAccuracyEntity, "statsId">
    | Omit<PlayerClutchesEntity, "statsId">
  >;

  constructor(
    private readonly database: DatabaseService,
    cache: MemoryCache,
  ) {
    this.totalStatsCache = new MemoryCacheAccessor(cache, "totalPlayerStats");
    this.weaponsCache = new MemoryCacheAccessor(cache, "weapons");
  }

  async getMatchesPerStep(
    offset: number,
    limit: number,
  ): Promise<MatchEntity[]> {
    const docs = await this.database.MatchModel.find()
      .skip(offset)
      .limit(limit)
      .lean();

    return docs.map(toMatchEntity);
  }

  /**
   * Saves analytical calculations to database. Established relations to created PlayerStatsEntity
   */
  async savePlayerAnalyticalData(
    rootCollection: PlayerStatsEntity,
    subCollections: PlayerAnalyticalEntity[],
  ): Promise<{ rootCollectionId: string }> {
    const result = await this.database.transaction(async () => {
      const { _id: statsId } = await this.database.PlayerStatsModel.create(
        toPlayerStatsModel(rootCollection),
      );

      const weaponsUsageEntity = subCollections.find(
        (s): s is PlayerWeaponsUsageEntity =>
          s._analyticsType === "weaponsUsage",
      );
      const others = subCollections.filter(
        (s) =>
          s._analyticsType !== "weaponStats" &&
          s._analyticsType !== "weaponsUsage",
      );

      await Promise.all(
        others.map((item) => {
          switch (item._analyticsType) {
            case "clutches":
              return this.database.PlayerClutchesModel.create(
                toPlayerClutchesModel({
                  ...item,
                  statsId: statsId.toString(),
                } as PlayerClutchesEntity),
              );
            case "economy":
              return this.database.PlayerEconomyModel.create(
                toPlayerEconomyModel({
                  ...item,
                  statsId: statsId.toString(),
                } as PlayerEconomyEntity),
              );
            case "accuracy":
              return this.database.PlayerAccuracyModel.create(
                toPlayerAccuracyModel({
                  ...item,
                  statsId: statsId.toString(),
                } as PlayerAccuracyEntity),
              );
            case "utility":
              return this.database.PlayerUtilityModel.create(
                toPlayerUtilityModel({
                  ...item,
                  statsId: statsId.toString(),
                } as PlayerUtilityEntity),
              );
          }
        }),
      );

      if (weaponsUsageEntity) {
        const { _id: usageId } =
          await this.database.PlayerWeaponsUsageModel.create(
            toPlayerWeaponsUsageModel({
              ...weaponsUsageEntity,
              statsId: statsId.toString(),
            }),
          );

        const weaponStatsEntity = subCollections.find(
          (s): s is PlayerWeaponStatsEntity =>
            s._analyticsType === "weaponStats",
        );
        if (weaponStatsEntity) {
          await Promise.all(
            toWeaponStatsModels(
              {
                ...weaponStatsEntity,
                statsId: statsId.toString(),
              },
              usageId,
            ).map((doc) => this.database.WeaponStatsModel.create(doc)),
          );
        }
      }

      return { rootCollectionId: statsId.toString() };
    });

    this.totalStatsCache.delete(rootCollection.participantSteamId);
    return result;
  }

  async getClutchRounds(
    matchId: string,
    steamId64: string,
  ): Promise<{ roundNumber: number; vs: number; outcome: "lost" | "won" }[]> {
    const match = await this.database.MatchModel.findOne({ _id: matchId });

    if (!match) throw new NotFoundError(`Match with id ${matchId} not found.`);

    const roundWinnerMap = new Map(
      (match.rounds ?? []).map((r) => [r.round_number, r.winner]),
    );

    const rawFrames = await this.database.DemoChunkModel.aggregate([
      { $match: { match_id: match._id } },
      { $unwind: "$frames" },
      {
        $match: {
          "frames.player_states": {
            $elemMatch: {
              steam_id_64: steamId64,
              is_alive: true,
              is_connected: true,
              team: { $in: ["T", "CT"] },
            },
          },
        },
      },
      {
        $addFields: {
          myTeam: {
            $getField: {
              field: "team",
              input: {
                $first: {
                  $filter: {
                    input: "$frames.player_states",
                    as: "p",
                    cond: { $eq: ["$$p.steam_id_64", steamId64] },
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          round_number: "$frames.game_state.round_number",
          demo_tick: "$frames.demo_tick",
          counts: {
            myTeam: "$myTeam",
            aliveTeammates: {
              $size: {
                $filter: {
                  input: "$frames.player_states",
                  as: "p",
                  cond: {
                    $and: [
                      { $eq: ["$$p.team", "$myTeam"] },
                      { $eq: ["$$p.is_alive", true] },
                      { $eq: ["$$p.is_connected", true] },
                    ],
                  },
                },
              },
            },
            aliveEnemies: {
              $size: {
                $filter: {
                  input: "$frames.player_states",
                  as: "p",
                  cond: {
                    $and: [
                      { $in: ["$$p.team", ["T", "CT"]] },
                      { $ne: ["$$p.team", "$myTeam"] },
                      { $eq: ["$$p.is_alive", true] },
                      { $eq: ["$$p.is_connected", true] },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$round_number",
          frames: { $push: { demo_tick: "$demo_tick", counts: "$counts" } },
        },
      },
    ]);

    return detectClutchRounds(rawFrames as RawClutchRound[], roundWinnerMap);
  }

  async getPlayerFinalStateForMatch(
    matchId: string,
    steamId64: string,
  ): Promise<PlayerState> {
    const match = await this.database.MatchModel.findOne({ _id: matchId });

    if (!match) throw new NotFoundError(`Match with id ${matchId} not found.`);

    const [result] = (await this.database.DemoChunkModel.aggregate([
      { $match: { match_id: match._id } },
      { $unwind: "$frames" },
      { $unwind: "$frames.player_states" },
      {
        $match: {
          "frames.player_states.steam_id_64": steamId64,
        },
      },
      { $sort: { "frames.game_tick": -1 } },
      { $replaceRoot: { newRoot: "$frames.player_states" } },
      { $limit: 1 },
    ])) as IPlayerState[];

    if (!result)
      throw new NotFoundError(
        `Final state for player with steam id:${steamId64} not found. Match: ${matchId}`,
      );

    return toPlayerStateEntity(result);
  }

  async getRoundsPlayedByPlayer(
    matchId: string,
    steamId64: string,
  ): Promise<RoundInfo[]> {
    const match = await this.database.MatchModel.findOne({ _id: matchId });

    if (!match) throw new NotFoundError(`Match with id ${matchId} not found.`);

    const result: { _id: number }[] =
      await this.database.DemoChunkModel.aggregate([
        { $match: { match_id: match._id } },
        { $unwind: "$frames" },
        { $unwind: "$frames.player_states" },
        {
          $match: {
            "frames.player_states.steam_id_64": steamId64,
            "frames.player_states.is_connected": true,
            "frames.player_states.team": { $in: ["T", "CT"] },
          },
        },
        { $group: { _id: "$frames.game_state.round_number" } },
      ]);

    const playedRoundNumbers = new Set(result.map((r) => r._id));

    return (match.rounds ?? [])
      .filter((r) => playedRoundNumbers.has(r.round_number))
      .map(
        (r): RoundInfo => ({
          roundNumber: r.round_number,
          winner: r.winner,
          startDemoTick: r.start_demo_tick,
          endDemoTick: r.end_demo_tick,
          startGameTick: r.start_game_tick,
          endGameTick: r.end_game_tick,
        }),
      );
  }

  async getTicksRange(payload: {
    step: number;
    startGameTick: number;
    endGameTick: number;
    matchId: string;
  }): Promise<DemoChunkEntity["frames"] | null> {
    const tickSet = Array.from(
      { length: (payload.endGameTick - payload.startGameTick) / payload.step },
      (_, i) => payload.startGameTick + i * payload.step,
    );

    const result = await this.database.DemoChunkModel.aggregate(
      [
        {
          $match: {
            match_id: new Types.ObjectId(payload.matchId),
            $or: [
              {
                start_game_tick: {
                  $gte: payload.startGameTick,
                  $lte: payload.endGameTick,
                },
              },
              {
                end_game_tick: {
                  $gte: payload.startGameTick,
                  $lte: payload.endGameTick,
                },
              },
              // include chunks that overlap the range start (e.g. tick-0 chunk with connect events)
              {
                start_game_tick: { $lte: payload.startGameTick },
                end_game_tick: { $gte: payload.startGameTick },
              },
            ],
          },
        },
        {
          $unwind: "$frames",
        },
        {
          $group: {
            _id: "$match_id",
            frames: { $push: "$frames" },
          },
        },
        {
          $project: {
            frames: {
              $map: {
                input: tickSet,
                as: "tick",
                in: {
                  $mergeObjects: [
                    // pick the last frame at this tick for player state (most up-to-date snapshot)
                    {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$frames",
                            as: "frame",
                            cond: { $eq: ["$$frame.game_tick", "$$tick"] },
                          },
                        },
                        -1,
                      ],
                    },
                    {
                      events: {
                        // collect events from all frames in range (prev tick, current tick]
                        $reduce: {
                          input: {
                            $filter: {
                              input: "$frames",
                              as: "frame",
                              cond: {
                                $and: [
                                  {
                                    $gt: [
                                      "$$frame.game_tick",
                                      {
                                        $cond: {
                                          if: {
                                            $eq: [
                                              "$$tick",
                                              payload.startGameTick,
                                            ],
                                          },
                                          then: -1,
                                          else: {
                                            $subtract: ["$$tick", payload.step],
                                          },
                                        },
                                      },
                                    ],
                                  },
                                  { $lte: ["$$frame.game_tick", "$$tick"] }, // inclusive upper bound to capture all frames at this tick
                                ],
                              },
                            },
                          },
                          initialValue: [],
                          in: {
                            $concatArrays: [
                              "$$value",
                              {
                                $map: {
                                  input: "$$this.events",
                                  as: "evt",
                                  in: {
                                    $mergeObjects: [
                                      "$$evt",
                                      {
                                        demo_tick: "$$this.demo_tick",
                                        game_tick: "$$this.game_tick",
                                      },
                                    ],
                                  },
                                },
                              },
                            ],
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ],
      { allowDiskUse: true },
    );

    if (!result || result.length === 0) return null;

    const frames = result.flatMap(
      (doc) => doc.frames,
    ) as IDemoChunkDocument["frames"];

    return frames.filter((f) => f?.game_state != null).map(toDemoChunkFrame);
  }

  async getAggregatedEvents<
    const T extends readonly EventConstructor<MatchEvent>[],
  >(
    filter: AggregatedEventsFilter,
    eventsToProject: T,
    cache?: EventsCache<T>,
  ): Promise<EventsFromConstructors<T>> {
    if (cache?.get()) return cache.get();

    const match = await this.database.MatchModel.findOne({
      _id: filter.matchId,
    }).lean();

    if (!match) throw new Error("No match found for matchId");

    const chunkMatch: Record<string, unknown> = { match_id: match._id };

    const buildCtorCondition = (
      ctor: EventConstructor<MatchEvent>,
    ): Record<string, unknown> => {
      const condition: Record<string, unknown> = { type: ctor.eventType };
      if (ctor.filterObject) {
        for (const [key, val] of Object.entries(ctor.filterObject)) {
          condition[`data.${key}`] = val;
        }
      }
      if (ctor.tickFilter) {
        for (const [key, val] of Object.entries(ctor.tickFilter)) {
          condition[key] = val;
        }
      }
      return condition;
    };

    const pipelinePrefix: PipelineStage[] = [
      { $match: chunkMatch },
      { $unwind: "$frames" },
      { $unwind: "$frames.events" },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$frames.events",
              { demoTick: "$frames.demo_tick", gameTick: "$frames.game_tick" },
            ],
          },
        },
      },
    ];

    const entries = await Promise.all(
      eventsToProject.map(async (ctor) => {
        const docs = await this.database.DemoChunkModel.aggregate([
          ...pipelinePrefix,
          { $match: buildCtorCondition(ctor) },
        ]);
        return [ctor.getFacetName(), docs] as const;
      }),
    );

    const facetResult: Record<string, unknown[]> = Object.fromEntries(entries);

    const projection = eventsToProject.map((ctor) => {
      const raw: unknown[] = facetResult?.[ctor.getFacetName()] ?? [];
      return raw.map((r) =>
        ctor.fromRaw(
          r as {
            type: string;
            data: Record<string, unknown>;
            demoTick: number;
            gameTick: number;
          },
        ),
      );
    }) as EventsFromConstructors<T>;

    cache?.set(projection);

    return projection;
  }

  async findByShareCode(shareCode: string): Promise<{ id: string } | null> {
    const match = await this.database.MatchModel.findOne(
      { share_code: shareCode },
      { _id: 1 },
    ).lean();
    if (!match) return null;
    return { id: String(match._id) };
  }

  async findByMatchId(matchId: string): Promise<MatchEntity | null> {
    const entity = await this.database.MatchModel.findOne({
      _id: matchId,
    });

    if (!entity) return null;

    return toMatchEntity(entity);
  }

  async getFirstGameTickOfEveryRound(matchId: string) {
    const match = await this.database.MatchModel.findOne({
      _id: matchId,
    });

    if (!match) return [];

    const firstTicksPerEachRound = match.rounds.map((r) => r.start_game_tick);

    const matchStartRounds =
      await this.database.DemoChunkModel.aggregate<IFrame>([
        {
          $match: { match_id: match._id },
        },
        { $unwind: "$frames" },
        {
          $match: {
            "frames.game_tick": {
              $in: firstTicksPerEachRound,
            },
          },
        },
        { $replaceRoot: { newRoot: "$frames" } },
      ]);

    return matchStartRounds.map(toDemoChunkFrame);
  }

  async getRoundInfoByFrame(
    matchId: string,
    frame: Frame,
  ): Promise<RoundInfo | null> {
    const match = await this.findByMatchId(matchId);
    if (!match) return null;

    const roundNumber = frame.gameState.roundNumber;
    return match.rounds.find((r) => r.roundNumber === roundNumber) ?? null;
  }

  async getMatchPlayerStats(
    matchId: string,
    steamId: string,
  ): Promise<PlayerStatsEntity | null> {
    const doc = await this.database.PlayerStatsModel.findOne({
      match_id: new Types.ObjectId(matchId),
      participant_steam_id: steamId,
    }).lean();

    return doc ? toPlayerStatsEntity(doc) : null;
  }

  async getTotalPlayerStats(
    steamId: string,
  ): Promise<PlayerStatsEntity | null> {
    if (this.totalStatsCache.has(steamId)) {
      return this.totalStatsCache.get(steamId)!;
    }

    const [result] = await this.database.PlayerStatsModel.aggregate([
      { $match: { participant_steam_id: steamId } },
      {
        $group: {
          _id: "$participant_steam_id",
          total_kills: { $sum: "$total_kills" },
          total_deaths: { $sum: "$total_deaths" },
          total_assists: { $sum: "$total_assists" },
          total_mvps: { $sum: "$total_mvps" },
          total_score: { $sum: "$total_score" },
          total_rounds_played: { $sum: "$total_rounds_played" },
          total_utility_damage: {
            $sum: { $toDouble: "$total_utility_damage" },
          },
          weighted_adr: {
            $sum: {
              $multiply: [{ $toDouble: "$total_adr" }, "$total_rounds_played"],
            },
          },
          weighted_hs: {
            $sum: {
              $multiply: [{ $toDouble: "$total_hs" }, "$total_kills"],
            },
          },
          weighted_kpr: {
            $sum: {
              $multiply: [{ $toDouble: "$total_kpr" }, "$total_rounds_played"],
            },
          },
          weighted_apr: {
            $sum: {
              $multiply: [{ $toDouble: "$total_apr" }, "$total_rounds_played"],
            },
          },
          total_kills_for_hs: { $sum: "$total_kills" },
        },
      },
      {
        $project: {
          participant_steam_id: "$_id",
          total_kills: 1,
          total_deaths: 1,
          total_assists: 1,
          total_mvps: 1,
          total_score: 1,
          total_rounds_played: 1,
          total_utility_damage: 1,
          total_adr: {
            $cond: [
              { $eq: ["$total_rounds_played", 0] },
              0,
              { $divide: ["$weighted_adr", "$total_rounds_played"] },
            ],
          },
          total_hs: {
            $cond: [
              { $eq: ["$total_kills_for_hs", 0] },
              0,
              { $divide: ["$weighted_hs", "$total_kills_for_hs"] },
            ],
          },
          total_kpr: {
            $cond: [
              { $eq: ["$total_rounds_played", 0] },
              0,
              { $divide: ["$weighted_kpr", "$total_rounds_played"] },
            ],
          },
          total_apr: {
            $cond: [
              { $eq: ["$total_rounds_played", 0] },
              0,
              { $divide: ["$weighted_apr", "$total_rounds_played"] },
            ],
          },
        },
      },
    ]);

    if (!result) return null;

    const entity: PlayerStatsEntity = {
      _analyticsType: "stats",
      participantSteamId: result.participant_steam_id,
      totalKills: result.total_kills,
      totalDeaths: result.total_deaths,
      totalAssists: result.total_assists,
      totalMvps: result.total_mvps,
      totalScore: result.total_score,
      totalRoundsPlayed: result.total_rounds_played,
      totalUtilityDamage: result.total_utility_damage,
      totalAdr: result.total_adr,
      totalHs: result.total_hs,
      totalKpr: result.total_kpr,
      totalApr: result.total_apr,
    };

    this.totalStatsCache.set(steamId, entity);
    return entity;
  }

  async getTransientEventsAtTick(
    matchId: string,
    gameTick: number,
    lookbackTicks: number,
  ): Promise<DemoEvent[]> {
    const windowStart = gameTick - lookbackTicks;
    const startEventTypes = [
      "grenade_throw",
      "grenade_fire_start",
      "bomb_planted",
      "bomb_defuse_start",
    ];

    const result = await this.database.DemoChunkModel.aggregate([
      {
        $match: {
          match_id: new Types.ObjectId(matchId),
          end_game_tick: { $gte: windowStart },
          start_game_tick: { $lte: gameTick },
        },
      },
      { $unwind: "$frames" },
      {
        $match: {
          "frames.game_tick": { $gte: windowStart, $lte: gameTick },
        },
      },
      { $unwind: "$frames.events" },
      {
        $match: {
          "frames.events.type": { $in: startEventTypes },
          "frames.events.data.ended_at": { $gt: gameTick },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              "$frames.events",
              {
                demo_tick: "$frames.demo_tick",
                game_tick: "$frames.game_tick",
              },
            ],
          },
        },
      },
    ]);

    return result.map((e) => ({
      type: e.type as string,
      data: e.data as Record<string, unknown>,
      demoTick: (e.demo_tick ?? 0) as number,
      gameTick: (e.game_tick ?? 0) as number,
    }));
  }

  private static matchesInRangeAggregation(
    steamId: string,
    date: Date,
    statsIdField = "stats_id",
  ) {
    return [
      {
        $lookup: {
          from: "player_stats",
          localField: statsIdField,
          foreignField: "_id",
          as: "stats",
        },
      },
      { $unwind: "$stats" },
      { $match: { "stats.participant_steam_id": steamId } },
      {
        $lookup: {
          from: "matches",
          localField: "stats.match_id",
          foreignField: "_id",
          as: "match",
        },
      },
      { $unwind: "$match" },
      { $match: { "match.date_played": { $gte: date } } },
    ] as PipelineStage[];
  }

  async aggregateWeaponUsagePct(steamId: string, startDate: Date) {
    const cacheKey = `usage:${steamId}:${startDate.getTime()}`;

    if (this.weaponsCache.has(cacheKey)) {
      return this.weaponsCache.get(cacheKey) as PlayerWeaponsUsageEntity;
    }

    const aggregatedResult =
      await this.database.PlayerWeaponsUsageModel.aggregate<IPlayerWeaponsUsage>(
        [
          ...MatchRepository.matchesInRangeAggregation(steamId, startDate),
          {
            $group: {
              _id: null,
              pistols_pct: { $avg: { $toDouble: "$pistols_pct" } },
              utility_pct: { $avg: { $toDouble: "$utility_pct" } },
              melee_pct: { $avg: { $toDouble: "$melee_pct" } },
              shotguns_pct: { $avg: { $toDouble: "$shotguns_pct" } },
              smg_pct: { $avg: { $toDouble: "$smg_pct" } },
              assault_rifle_pct: { $avg: { $toDouble: "$assault_rifle_pct" } },
              sniper_rifles_pct: { $avg: { $toDouble: "$sniper_rifles_pct" } },
              machine_guns_pct: { $avg: { $toDouble: "$machine_guns_pct" } },
            },
          },
        ],
      );

    if (!aggregatedResult[0]) {
      return toPlayerWeaponsUsageEntity({} as IPlayerWeaponsUsage);
    }

    const entity = toPlayerWeaponsUsageEntity(aggregatedResult[0]);
    this.weaponsCache.set(cacheKey, entity);
    return entity;
  }

  async aggregateWeaponStats(steamId: string, startDate: Date) {
    const cacheKey = `stats:${steamId}:${startDate.getTime()}`;

    if (this.weaponsCache.has(cacheKey)) {
      return this.weaponsCache.get(cacheKey) as PlayerWeaponStatsEntity;
    }

    const aggregatedResult =
      await this.database.WeaponStatsModel.aggregate<IWeaponStats>([
        {
          $lookup: {
            from: "player_weapons_usage",
            localField: "player_weapon_usage_id",
            foreignField: "_id",
            as: "usage",
          },
        },
        { $unwind: "$usage" },
        ...MatchRepository.matchesInRangeAggregation(
          steamId,
          startDate,
          "usage.stats_id",
        ),
        {
          $group: {
            _id: "$weapon_name",
            weapon_name: { $first: "$weapon_name" },
            kills: { $sum: { $toInt: "$kills" } },
            deaths: { $sum: { $toInt: "$deaths" } },
            hits: { $sum: { $toInt: "$hits" } },
            shots: { $sum: { $toInt: "$shots" } },
            damage: { $sum: { $toInt: "$damage" } },
            headshots: { $sum: { $toInt: "$headshots" } },
          },
        },
      ]);

    const entity = toPlayerWeaponStatsEntity({} as never, aggregatedResult);
    this.weaponsCache.set(cacheKey, entity);
    return entity;
  }

  async aggregateUtilityUsage(steamId: string, startDate: Date) {
    const cacheKey = `utility:${steamId}:${startDate.getTime()}`;

    if (this.weaponsCache.has(cacheKey)) {
      return this.weaponsCache.get(cacheKey) as Omit<
        PlayerUtilityEntity,
        "statsId"
      >;
    }

    const aggregatedResult =
      await this.database.PlayerUtilityModel.aggregate<IPlayerUtility>([
        ...MatchRepository.matchesInRangeAggregation(steamId, startDate),
        {
          $group: {
            _id: null,
            grenades_thrown: { $sum: { $toInt: "$grenades_thrown" } },
            he_thrown: { $sum: { $toInt: "$he_thrown" } },
            smokes_thrown: { $sum: { $toInt: "$smokes_thrown" } },
            molotovs_thrown: { $sum: { $toInt: "$molotovs_thrown" } },
            flashes_thrown: { $sum: { $toInt: "$flashes_thrown" } },
            incendiaries_thrown: { $sum: { $toInt: "$incendiaries_thrown" } },
            teammates_flashed: { $sum: { $toInt: "$teammates_flashed" } },
            enemies_flashed: { $sum: { $toInt: "$enemies_flashed" } },
            flash_duration: { $sum: { $toDouble: "$flash_duration" } },
            molotovs_damage: { $sum: { $toInt: "$molotovs_damage" } },
            he_damage: { $sum: { $toInt: "$he_damage" } },
          },
        },
      ]);

    const entity = toPlayerUtilityEntity(
      aggregatedResult[0] ?? ({} as IPlayerUtility),
    );
    this.weaponsCache.set(cacheKey, entity);
    return entity;
  }

  async aggregateEconomyUsage(steamId: string, startDate: Date) {
    const cacheKey = `economy:${steamId}:${startDate.getTime()}`;

    if (this.weaponsCache.has(cacheKey)) {
      return this.weaponsCache.get(cacheKey) as Omit<
        PlayerEconomyEntity,
        "statsId"
      >;
    }

    const aggregatedResult =
      await this.database.PlayerEconomyModel.aggregate<IPlayerEconomy>([
        ...MatchRepository.matchesInRangeAggregation(steamId, startDate),
        {
          $group: {
            _id: null,
            rounds_eco: { $sum: { $toInt: "$rounds_eco" } },
            rounds_force_buy: { $sum: { $toInt: "$rounds_force_buy" } },
            rounds_full_buy: { $sum: { $toInt: "$rounds_full_buy" } },
            rounds_pistol: { $sum: { $toInt: "$rounds_pistol" } },
            rounds_eco_won: { $sum: { $toInt: "$rounds_eco_won" } },
          },
        },
      ]);

    const entity = toPlayerEconomyEntity(
      aggregatedResult[0] ?? ({} as IPlayerEconomy),
    );
    this.weaponsCache.set(cacheKey, entity);
    return entity;
  }

  async aggregateAccuracy(
    steamId: string,
    startDate: Date,
  ): Promise<Omit<PlayerAccuracyEntity, "statsId">> {
    const cacheKey = `accuracy:${steamId}:${startDate.getTime()}`;

    if (this.weaponsCache.has(cacheKey)) {
      return this.weaponsCache.get(cacheKey) as Omit<
        PlayerAccuracyEntity,
        "statsId"
      >;
    }

    const aggregatedResult =
      await this.database.PlayerAccuracyModel.aggregate<IPlayerAccuracy>([
        ...MatchRepository.matchesInRangeAggregation(steamId, startDate),
        {
          $group: {
            _id: null,
            total_shots: { $sum: { $toInt: "$total_shots" } },
            total_hits: { $sum: { $toInt: "$total_hits" } },
            headshots: { $sum: { $toInt: "$headshots" } },
            hit_breakdown_generic: {
              $sum: { $toInt: "$hit_breakdown.generic" },
            },
            hit_breakdown_head: { $sum: { $toInt: "$hit_breakdown.head" } },
            hit_breakdown_chest: { $sum: { $toInt: "$hit_breakdown.chest" } },
            hit_breakdown_stomach: {
              $sum: { $toInt: "$hit_breakdown.stomach" },
            },
            hit_breakdown_left_arm: {
              $sum: { $toInt: "$hit_breakdown.left_arm" },
            },
            hit_breakdown_right_arm: {
              $sum: { $toInt: "$hit_breakdown.right_arm" },
            },
            hit_breakdown_left_leg: {
              $sum: { $toInt: "$hit_breakdown.left_leg" },
            },
            hit_breakdown_right_leg: {
              $sum: { $toInt: "$hit_breakdown.right_leg" },
            },
            hit_breakdown_neck: { $sum: { $toInt: "$hit_breakdown.neck" } },
            hit_breakdown_gear: { $sum: { $toInt: "$hit_breakdown.gear" } },
            hit_breakdown_unknown: {
              $sum: { $toInt: "$hit_breakdown.unknown" },
            },
          },
        },
        {
          $addFields: {
            top_level_accuracy: {
              $cond: [
                { $eq: ["$total_shots", 0] },
                0,
                { $divide: ["$total_hits", "$total_shots"] },
              ],
            },
            hit_breakdown: {
              generic: "$hit_breakdown_generic",
              head: "$hit_breakdown_head",
              chest: "$hit_breakdown_chest",
              stomach: "$hit_breakdown_stomach",
              left_arm: "$hit_breakdown_left_arm",
              right_arm: "$hit_breakdown_right_arm",
              left_leg: "$hit_breakdown_left_leg",
              right_leg: "$hit_breakdown_right_leg",
              neck: "$hit_breakdown_neck",
              gear: "$hit_breakdown_gear",
              unknown: "$hit_breakdown_unknown",
            },
          },
        },
      ]);

    const entity = toPlayerAccuracyEntity(aggregatedResult[0] ?? {});
    this.weaponsCache.set(cacheKey, entity);
    return entity;
  }
  async aggregateClutches(
    steamId: string,
    startDate: Date,
  ): Promise<Omit<PlayerClutchesEntity, "statsId">> {
    const cacheKey = `clutches:${steamId}:${startDate.getTime()}`;

    if (this.weaponsCache.has(cacheKey)) {
      return this.weaponsCache.get(cacheKey) as Omit<
        PlayerClutchesEntity,
        "statsId"
      >;
    }

    const aggregatedResult =
      await this.database.PlayerClutchesModel.aggregate<IPlayerClutches>([
        ...MatchRepository.matchesInRangeAggregation(steamId, startDate),
        {
          $group: {
            _id: null,
            clutch_1v1_attempted: {
              $sum: { $ifNull: ["$clutch_1v1.attempted", 0] },
            },
            clutch_1v1_won: { $sum: { $ifNull: ["$clutch_1v1.won", 0] } },
            clutch_1v2_attempted: {
              $sum: { $ifNull: ["$clutch_1v2.attempted", 0] },
            },
            clutch_1v2_won: { $sum: { $ifNull: ["$clutch_1v2.won", 0] } },
            clutch_1v3_attempted: {
              $sum: { $ifNull: ["$clutch_1v3.attempted", 0] },
            },
            clutch_1v3_won: { $sum: { $ifNull: ["$clutch_1v3.won", 0] } },
            clutch_1v4_attempted: {
              $sum: { $ifNull: ["$clutch_1v4.attempted", 0] },
            },
            clutch_1v4_won: { $sum: { $ifNull: ["$clutch_1v4.won", 0] } },
            clutch_1v5_attempted: {
              $sum: { $ifNull: ["$clutch_1v5.attempted", 0] },
            },
            clutch_1v5_won: { $sum: { $ifNull: ["$clutch_1v5.won", 0] } },
          },
        },
        {
          $project: {
            _id: 0,
            clutch_1v1: {
              attempted: "$clutch_1v1_attempted",
              won: "$clutch_1v1_won",
            },
            clutch_1v2: {
              attempted: "$clutch_1v2_attempted",
              won: "$clutch_1v2_won",
            },
            clutch_1v3: {
              attempted: "$clutch_1v3_attempted",
              won: "$clutch_1v3_won",
            },
            clutch_1v4: {
              attempted: "$clutch_1v4_attempted",
              won: "$clutch_1v4_won",
            },
            clutch_1v5: {
              attempted: "$clutch_1v5_attempted",
              won: "$clutch_1v5_won",
            },
          },
        },
      ]);

    const entity = toPlayerClutchesEntity(aggregatedResult[0] ?? {});
    this.weaponsCache.set(cacheKey, entity);
    return entity;
  }

  private static readonly validMatchFilter = {
    $expr: {
      $and: [
        { $gt: [{ $size: { $ifNull: ["$rounds", []] } }, 0] },
        { $gt: [{ $size: { $ifNull: ["$participants", []] } }, 0] },
      ],
    },
  };

  async getMatches(
    skip: number,
    take: number,
    steamIds?: string[],
  ): Promise<MatchEntity[]> {
    const filter = steamIds?.length
      ? {
          ...MatchRepository.validMatchFilter,
          "participants.steam_id": { $in: steamIds },
        }
      : MatchRepository.validMatchFilter;

    const matches = await this.database.MatchModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(take);

    return matches.map(toMatchEntity);
  }

  async getTotalMatches(steamIds?: string[]): Promise<number> {
    const filter = steamIds?.length
      ? {
          ...MatchRepository.validMatchFilter,
          "participants.steam_id": { $in: steamIds },
        }
      : MatchRepository.validMatchFilter;

    return this.database.MatchModel.countDocuments(filter);
  }

  async isMatchWithShareCodeExists(code: string): Promise<boolean> {
    const result = await this.database.MatchModel.exists({
      share_code: code,
    });

    return Boolean(result);
  }

  async getAnalyzedMatchesFromSet(s: Set<string>): Promise<Set<string>> {
    const matches = await this.database.PlayerStatsModel.distinct("match_id", {
      match_id: { $in: Array.from(s).map((id) => new Types.ObjectId(id)) },
    });

    return new Set(matches.map((id) => id.toString()));
  }
}
