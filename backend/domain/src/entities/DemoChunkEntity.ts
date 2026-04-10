export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Equipment {
  activeWeapon: string;
  weapons: string[];
  grenades: string[];
}

export interface PlayerState {
  steamId64: string;
  name: string;
  userId: number;
  team: string;
  position: Vector3;
  viewDirection: Vector2;
  velocity: Vector3;
  hp: number;
  armor: number;
  hasHelmet: boolean;
  hasDefuseKit: boolean;
  money: number;
  currentEquipment: Equipment;
  isAlive: boolean;
  isBot: boolean;
  isConnected: boolean;
  isDucking: boolean;
  isDefusing: boolean;
  isPlanting: boolean;
  isReloading: boolean;
  isScoped: boolean;
  isWalking: boolean;
  flashDuration: number;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  mvps: number;
}

export interface GameState {
  roundNumber: number;
  phase: string;
  ctScore: number;
  tScore: number;
  timeRemaining: number;
  bombPlanted: boolean;
  bombSite?: string;
  bombTimeRemaining: number;
}

export interface DemoEvent {
  type: string;
  data: Record<string, unknown>;
}

export interface Reconnection {
  steamId64: string;
  name: string;
  reconnectType: string;
}

export interface Frame {
  demoTick: number;
  gameTick: number;
  timestamp: number;
  playerStates: PlayerState[];
  gameState: GameState;
  events: DemoEvent[];
  reconnections?: Reconnection[];
}

export interface DemoChunkEntity {
  messageType: string;
  demoId: string;
  chunkIndex: number;
  startTick: number;
  endTick: number;
  startGameTick: number;
  endGameTick: number;
  frames: Frame[];
  createdAt: Date;
  updatedAt: Date;
}