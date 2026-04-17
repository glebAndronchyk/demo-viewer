import type { HitGroup } from "./HitGroup.ts";
import type { PlayerAnalyticalEntity } from "./PlayerAnalyticalEntity.ts";

export interface PlayerAccuracyEntity extends PlayerAnalyticalEntity {
  _analyticsType: "accuracy";
  statsId: string;
  totalShots?: number;
  totalHits?: number;
  headshots?: number;
  topLevelAccuracy?: number;
  hitBreakdown?: Record<HitGroup, number>;
  dateRecorded?: Date;
}
