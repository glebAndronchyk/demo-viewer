export interface RoundInfo {
  roundNumber: number;
  winner: string;
  startDemoTick: number;
  endDemoTick: number;
  startGameTick: number;
  endGameTick: number;
}

export interface MatchOutcome {
  winner: string;
  tScore: number;
  ctScore: number;
}

export interface MatchParticipant {
  steamId?: string;
  userId?: string;
  playerName: string;
  isBot: boolean;
}

export interface MatchEntity {
  id: string;
  dateUploaded: Date;
  datePlayed: Date;
  chunkCount: number;
  participants: MatchParticipant[];
  mapId: string;
  visibleForAll: boolean;
  groupId?: string | null;
  crawled: boolean;
  createdAt: Date;
  updatedAt: Date;
  demoId: string;
  mapName: string;
  serverName: string;
  clientName: string;
  duration: number;
  tickRate: number;
  frameRate: number;
  signonLength: number;
  playbackTicks: number;
  playbackFrames: number;
  parsedAt: string;
  shareCode?: string;
  rounds: RoundInfo[];
  outcome: MatchOutcome;
}
