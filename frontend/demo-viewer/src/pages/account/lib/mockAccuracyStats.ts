import type { PerformanceAnalyticsResponseData } from "@demo-viewer/shared-types";

export const mockAccuracyStats: PerformanceAnalyticsResponseData = {
  accuracy: {
      totalShots: 1200,
      totalHits: 480,
      headshots: 96,
      topLevelAccuracy: 0.4,
      hitBreakdown: {
        Generic: 5,
        Head: 96,
        Chest: 180,
        Stomach: 72,
        LeftArm: 42,
        RightArm: 38,
        LeftLeg: 25,
        RightLeg: 18,
        Neck: 3,
        Gear: 1,
        Unknown: 0,
      },
      dateRecorded: new Date().toISOString(),
  },
  clutches: {
      clutch1v1: { attempted: 18, won: 11 },
      clutch1v2: { attempted: 10, won: 4 },
      clutch1v3: { attempted: 5, won: 1 },
      clutch1v4: { attempted: 2, won: 0 },
      clutch1v5: { attempted: 1, won: 0 },
  },
};
