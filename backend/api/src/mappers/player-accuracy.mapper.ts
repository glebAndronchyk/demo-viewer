import type { IPlayerAccuracy } from "@demo-viewer/database/dist/types/performance.types";
import type { PlayerAccuracyEntity } from "@demo-viewer/domain/src/entities/PlayerAccuracyEntity";
import type { HitGroup } from "@demo-viewer/domain/src/entities/HitGroup";
import { Types } from "mongoose";

function decimal128ToNumber(value?: Types.Decimal128): number | undefined {
  return value != null ? parseFloat(value.toString()) : undefined;
}

export function toPlayerAccuracyEntity(
  doc: Partial<IPlayerAccuracy>,
): PlayerAccuracyEntity {
  let hitBreakdown: Record<HitGroup, number> | undefined;
  if (doc.hit_breakdown) {
    const b = doc.hit_breakdown;
    hitBreakdown = {
      Generic: b.generic,
      Head: b.head,
      Chest: b.chest,
      Stomach: b.stomach,
      LeftArm: b.left_arm,
      RightArm: b.right_arm,
      LeftLeg: b.left_leg,
      RightLeg: b.right_leg,
      Neck: b.neck,
      Gear: b.gear,
      Unknown: b.unknown,
    };
  }

  return {
    _analyticsType: "accuracy",
    statsId: doc.stats_id,
    totalShots: doc.total_shots,
    totalHits: doc.total_hits,
    headshots: doc.headshots,
    topLevelAccuracy: decimal128ToNumber(doc.top_level_accuracy),
    hitBreakdown,
    dateRecorded: doc.date_recorded,
  };
}
