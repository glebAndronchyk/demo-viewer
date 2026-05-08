import type { GenericCommand } from "../lib/command_bus";

export interface GetPaginatedMatchesCommand extends GenericCommand<"get_paginated_matchers"> {
  page: number;
}

export interface GetPaginatedMatchesCommandResult {
  totalPages: number;
  page: {
    demoId: string;
    map: string;
    outcome: {
      winner: "T" | "CT" | "Draw";
      ctWins: number;
      tWins: number;
      totalRounds: number;
    };
    players: {
      name: string;
      steamId: string;
      avatar: string;
    }[];
  }[];
}
