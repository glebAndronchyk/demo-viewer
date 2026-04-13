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

export class MatchRepository implements MatchOutboundPort {
  constructor(private readonly database: DatabaseService) {}

  async getPlayerFinalStateForMatch(
    matchId: string,
    steamId64: string,
  ): Promise<PlayerState> {
    const match = await this.database.MatchModel.findOne({ _id: matchId });

    if (!match) throw new NotFoundError(`Match with id ${matchId} not found.`);

    const [result] = (await this.database.DemoChunkModel.aggregate([
      { $match: { demo_id: match.demo_id } },
      { $sort: { end_game_tick: -1 } },
      { $unwind: "$frames" },
      { $sort: { "frames.game_tick": -1 } },
      { $unwind: "$frames.player_states" },
      { $match: { "frames.player_states.steam_id_64": steamId64 } },
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
    });

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

    const allEvents = result
      .map((raw) => {
        const ctor = eventsToProject.find((c) => c.eventType === raw.type);
        return ctor
          ? ctor.fromRaw(raw as { type: string; data: Record<string, unknown> })
          : null;
      })
      .filter((e) => e !== null);

    const projection = eventsToProject.map((ctor) =>
      allEvents.filter((e) => ctor.is(e)),
    ) as EventsFromConstructors<T>;

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
