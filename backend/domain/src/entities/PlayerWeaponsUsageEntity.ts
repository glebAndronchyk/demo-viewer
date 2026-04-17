import type { PlayerAnalyticalEntity } from "./PlayerAnalyticalEntity.ts";

export interface PlayerWeaponsUsageEntity extends PlayerAnalyticalEntity {
  _analyticsType: "weaponsUsage";
  statsId: string;
  pistolsPct?: number;
  utilityPct?: number;
  meleePct?: number;
  shotgunsPct?: number;
  smgPct?: number;
  assaultRiflePct?: number;
  sniperRiflePct?: number;
  machineGunPct?: number;
  dateRecorded?: Date;
}
