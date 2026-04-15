export interface PlayerUtilityEntity {
  statsId: string;
  grenadesThrown?: number;
  heThrown?: number;
  smokesThrown?: number;
  molotovsThrown?: number;
  flashesThrown?: number;
  incendiariesThrown?: number;
  teammatesFlashed?: number;
  molotovsDamage?: number;
  heDamage?: number;
  enemiesFlashed?: number;
  flashDuration?: number;
  dateRecorded?: Date;
}