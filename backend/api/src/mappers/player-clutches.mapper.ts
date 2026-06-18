import {
  IPlayerClutches,
  IClutchStat,
} from "@demo-viewer/database/dist/types/round_outcome.types";
import {
  ClutchStatEntity,
  PlayerClutchesEntity,
} from "@demo-viewer/domain/src/entities/PlayerClutchesEntity";
import { Types } from "mongoose";

type PlayerClutchesInput = Partial<Omit<IPlayerClutches, "stats_id"> & { stats_id?: Types.ObjectId | string }>;

function toClutchStatEntity(stat?: IClutchStat): ClutchStatEntity | undefined {
  if (!stat) return undefined;
  return {
    attempted: stat.attempted,
    won: stat.won,
  };
}

export function toPlayerClutchesEntity(
  doc: PlayerClutchesInput,
): PlayerClutchesEntity {
  return {
    statsId: doc.stats_id?.toString() ?? "",
    _analyticsType: "clutches",
    clutch1v1: toClutchStatEntity(doc.clutch_1v1),
    clutch1v2: toClutchStatEntity(doc.clutch_1v2),
    clutch1v3: toClutchStatEntity(doc.clutch_1v3),
    clutch1v4: toClutchStatEntity(doc.clutch_1v4),
    clutch1v5: toClutchStatEntity(doc.clutch_1v5),
  };
}
