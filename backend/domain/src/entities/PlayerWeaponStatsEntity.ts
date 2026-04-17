export interface WeaponStatsEntry {
  weaponName: string;
  kills: number;
  deaths: number;
  hits: number;
  shots: number;
  damage: number;
  headshots: number;
}

import type { PlayerAnalyticalEntity } from "./PlayerAnalyticalEntity.ts";

export interface PlayerWeaponStatsEntity extends PlayerAnalyticalEntity {
  _analyticsType: "weaponStats";
  statsId: string;
  weapons: WeaponStatsEntry[];
  dateRecorded?: Date;
}
