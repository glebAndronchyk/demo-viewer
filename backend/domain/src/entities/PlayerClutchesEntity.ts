export interface ClutchStatEntity {
  attempted: number;
  won: number;
}

export type PlayerEntityClutchField<T extends number = number> = `clutch1v${T}`;

export type PlayerClutchesEntity = {
  [K in PlayerEntityClutchField<1 | 2 | 3 | 4 | 5>]?: ClutchStatEntity;
} & { statsId: string };
