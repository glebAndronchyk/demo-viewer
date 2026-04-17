import type { PlayerAnalyticalEntity } from "./PlayerAnalyticalEntity.ts";

export interface PlayerEconomyEntity extends PlayerAnalyticalEntity {
  _analyticsType: "economy";
  statsId: string;
  roundsEco?: number;
  roundsForceBuy?: number;
  roundsFullBuy?: number;
  roundsPistol?: number;
  roundsEcoWon?: number;
  dateRecorded?: Date;
}