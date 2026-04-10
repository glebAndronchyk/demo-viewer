import type { GenericCommand } from "../lib/command_bus";

export interface GetMatchManifestCommand extends GenericCommand<"get_match_manifest"> {
  matchId: string;
}

export interface GetMatchManifestCommandResult {
  mapName: string;
  mapServer: string;
  participants: {
    userId?: string | null;
    steamId?: string | null;
    isBot: boolean;
    name: string;
  }[];
  round: []; // todo
  outcome: never; // todo
  demoId: string;
  tickRate: number;
  totalTicks: number;
}
