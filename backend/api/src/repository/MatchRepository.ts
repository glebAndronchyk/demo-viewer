import { MatchOutboundPort } from "@demo-viewer/domain/src/ports/outbound/MatchOutboundPort";
import { MatchEntity } from "@demo-viewer/domain/src/entities/MatchEntity";
import { DatabaseService } from "../services/DatabaseService";
import { toMatchEntity } from "../mappers/match.mapper";
import { DemoChunkEntity } from "@demo-viewer/domain/src/entities/DemoChunkEntity";
import { IDemoChunkDocument } from "@demo-viewer/database/dist/types/demo_chunk.types";
import { toDemoChunkFrame } from "../mappers/demo-chunk-frame.mapper";

export class MatchRepository implements MatchOutboundPort {
  constructor(private readonly database: DatabaseService) {}

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
