import type { HitGroup } from "./HitGroup.ts";

export interface PlayerAccuracyEntity {
  statsId: string;
  totalShots?: number;
  totalHits?: number;
  headshots?: number;
  topLevelAccuracy?: number;
  hitBreakdown?: Record<HitGroup, number>;
  dateRecorded?: Date;
}
