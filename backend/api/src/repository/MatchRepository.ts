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
import { toPlayerStatsModel } from "../mappers/player-stats.mapper";
import {
  toPlayerAccuracyModel,
  toPlayerClutchesModel,
  toPlayerEconomyModel,
  toPlayerUtilityModel,
  toPlayerWeaponsUsageModel,
  toWeaponStatsModels,
} from "../mappers/player-analytics.mapper";
import { detectClutchRounds, type RawClutchRound } from "./detectClutchRounds";
import { PlayerAccuracyEntity } from "@demo-viewer/domain/src/entities/PlayerAccuracyEntity";

export { detectClutchRounds };

export class MatchRepository implements MatchOutboundPort {
  constructor(private readonly database: DatabaseService) {}

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
              usageId.toString(),
            ).map((doc) => this.database.WeaponStatsModel.create(doc)),
          );
        }
      }

      return { rootCollectionId: statsId.toString() };
    });

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
      { $match: { demo_id: match.demo_id } },
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
        $project: {
          round_number: "$frames.game_state.round_number",
          demo_tick: "$frames.demo_tick",
          counts: {
            $let: {
              vars: {
                myTeam: {
                  $getField: {
                    field: "team",
                    input: {
                      $first: {
                        $filter: {
                          input: "$frames.player_states",
                          as: "p",
                          cond: {
                            $eq: ["$$p.steam_id_64", steamId64],
                          },
                        },
                      },
                    },
                  },
                },
              },
              in: {
                myTeam: "$$myTeam",
                aliveTeammates: {
                  $size: {
                    $filter: {
                      input: "$frames.player_states",
                      as: "p",
                      cond: {
                        $and: [
                          { $eq: ["$$p.team", "$$myTeam"] },
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
                          { $ne: ["$$p.team", "$$myTeam"] },
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
      { $match: { demo_id: match.demo_id } },
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
        { $match: { demo_id: match.demo_id } },
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
    demoId: string;
  }): Promise<DemoChunkEntity["frames"] | null> {
    const tickSet = Array.from(
      { length: (payload.endGameTick - payload.startGameTick) / payload.step },
      (_, i) => payload.startGameTick + i * payload.step,
    );

    const result = await this.database.DemoChunkModel.aggregate([
      {
        $match: {
          demo_id: payload.demoId,
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
          ],
        },
      },
      {
        $unwind: "$frames",
      },
      {
        $group: {
          _id: "$demo_id",
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
                $let: {
                  vars: {
                    // set targetFrame
                    targetFrame: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$frames",
                            as: "frame",
                            cond: { $eq: ["$$frame.game_tick", "$$tick"] },
                          },
                        },
                        0,
                      ],
                    },
                    // aggregate events between requested frames
                    accumulatedEvents: {
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
                                    { $subtract: ["$$tick", payload.step] },
                                  ], // use previous requested tick as lower bound of operation
                                },
                                { $lt: ["$$frame.game_tick", "$$tick"] }, // use current requested tick as upper bound of operation
                              ],
                            },
                          },
                        },
                        initialValue: [],
                        in: { $concatArrays: ["$$value", "$$this.events"] }, // join events of all received frames
                      },
                    },
                  },
                  in: {
                    $mergeObjects: [
                      "$$targetFrame",
                      {
                        events: {
                          $concatArrays: [
                            "$$accumulatedEvents",
                            { $ifNull: ["$$targetFrame.events", []] },
                          ],
                        },
                      }, // override current requested freame events with aggregated one
                    ],
                  },
                },
              },
            },
          },
        },
      },
    ]);

    if (!result || result.length === 0) return null;

    const frames = result.flatMap(
      (doc) => doc.frames,
    ) as IDemoChunkDocument["frames"];

    return frames.map(toDemoChunkFrame);
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

    const chunkMatch: Record<string, unknown> = {};
    if (match.demo_id !== undefined) chunkMatch["demo_id"] = match.demo_id;

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

    const facetStages = Object.fromEntries(
      eventsToProject.map((ctor) => [
        ctor.getFacetName(),
        [{ $match: buildCtorCondition(ctor) }],
      ]),
    );

    const [facetResult] = await this.database.DemoChunkModel.aggregate([
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
      { $facet: facetStages },
    ]);

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
          $match: { demo_id: match.demo_id },
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
}
