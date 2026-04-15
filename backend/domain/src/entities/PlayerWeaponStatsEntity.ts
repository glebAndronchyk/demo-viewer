export interface WeaponStatsEntry {
  weaponName: string;
  kills: number;
  deaths: number;
  hits: number;
  shots: number;
  damage: number;
  headshots: number;
}

export interface PlayerWeaponStatsEntity {
  statsId: string;
  weapons: WeaponStatsEntry[];
  dateRecorded?: Date;
}
