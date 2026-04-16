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
  PlayerState,
} from "@demo-viewer/domain/src/entities/DemoChunkEntity";
import {
  IDemoChunkDocument,
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

type ClutchFrame = {
  demo_tick: number;
  counts: { myTeam: string; aliveTeammates: number; aliveEnemies: number };
};

type RawClutchRound = { _id: number; frames: ClutchFrame[] };

export function detectClutchRounds(
  rawFrames: RawClutchRound[],
  roundWinnerMap: Map<number, string>,
): { roundNumber: number; vs: number; outcome: "lost" | "won" }[] {
  const results: {
    roundNumber: number;
    vs: number;
    outcome: "lost" | "won";
  }[] = [];

  for (const round of rawFrames) {
    const roundNumber = round._id;
    const winner = roundWinnerMap.get(roundNumber);
    if (!winner) continue;

    const frames = round.frames
      .slice()
      .sort((a, b) => a.demo_tick - b.demo_tick);

    let clutchEnemyCount: number | null = null;
    let playerTeam: string | null = null;

    for (const frame of frames) {
      const { myTeam, aliveTeammates, aliveEnemies } = frame.counts;
      if (!playerTeam) playerTeam = myTeam;

      if (aliveTeammates === 1) {
        clutchEnemyCount = aliveEnemies;
        break;
      }
    }

    if (clutchEnemyCount === null || clutchEnemyCount === 0 || !playerTeam)
      continue;

    const outcome = winner === playerTeam ? "won" : "lost";
    results.push({ roundNumber, vs: clutchEnemyCount, outcome });
  }

  return results;
}

export class MatchRepository implements MatchOutboundPort {
  constructor(private readonly database: DatabaseService) {}

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

    const eventTypeFilter = {
      $or: eventsToProject.map((ctor) => {
        const condition: Record<string, unknown> = { type: ctor.eventType };
        if (ctor.filterObject) {
          for (const [key, val] of Object.entries(ctor.filterObject)) {
            condition[`data.${key}`] = val;
          }
        }
        return condition;
      }),
    };

    const result = await this.database.DemoChunkModel.aggregate([
      { $match: chunkMatch },
      { $unwind: "$frames" },
      { $unwind: "$frames.events" },
      { $replaceRoot: { newRoot: "$frames.events" } },
      { $match: eventTypeFilter },
    ]);

    const projection = eventsToProject.map((ctor) => {
      return result
        .filter((raw) => {
          if (raw.type !== ctor.eventType) return false;
          if (!ctor.filterObject) return true;
          return Object.entries(ctor.filterObject).every(
            ([key, val]) => raw.data?.[key] === val,
          );
        })
        .map((raw) =>
          ctor.fromRaw(raw as { type: string; data: Record<string, unknown> }),
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
}
