import type { GenericCommand } from "../lib/command_bus";

export interface GetMatchManifestCommand extends GenericCommand<"get_match_manifest"> {
  matchId: string;
}

export interface ManifestRound {
  roundNumber: number;
  winner: string;
  startDemoTick: number;
  endDemoTick: number;
  startGameTick: number;
  endGameTick: number;
}

export interface ManifestOutcome {
  winner: string;
  tScore: number;
  ctScore: number;
}

export interface GetMatchManifestCommandResult {
  mapName: string;
  mapRadarLayers: Record<string, string>; // todo proper assets map
  mapServer: string;
  participants: {
    userId?: string | null;
    steamId?: string | null;
    isBot: boolean;
    name: string;
  }[];
  rounds: ManifestRound[];
  outcome: ManifestOutcome;
  demoId: string;
  tickRate: number;
  totalTicks: number;
}
