import type { ApiSuccessResponse } from "../common/ApiResponse.ts";

export interface Vector2Dto {
  x: number;
  y: number;
}

export interface Vector3Dto {
  x: number;
  y: number;
  z: number;
}

export interface EquipmentDto {
  activeWeapon: string;
  weapons: string[];
  grenades: string[];
}

export interface PlayerStateDto {
  steamId64: string;
  name: string;
  userId: number;
  team: string;
  position: Vector3Dto;
  viewDirection: Vector2Dto;
  velocity: Vector3Dto;
  hp: number;
  armor: number;
  hasHelmet: boolean;
  hasDefuseKit: boolean;
  money: number;
  currentEquipment: EquipmentDto;
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

export interface GameStateDto {
  roundNumber: number;
  phase: string;
  ctScore: number;
  tScore: number;
  timeRemaining: number;
  bombPlanted: boolean;
  bombSite?: string;
  bombTimeRemaining: number;
}

export type HitGroup =
  | "Generic" | "Head" | "Chest" | "Stomach"
  | "LeftArm" | "RightArm" | "LeftLeg" | "RightLeg"
  | "Neck" | "Gear" | "Unknown";

export type TeamType = "T" | "CT" | "Unknown";

export type BombSite = "A" | "B" | "Unknown";

export type RoundEndWinner = "T" | "CT" | "Spectators" | "Unknown";

export interface GrenadePositionData {
  grenade_position: { x: number; y: number; z: number };
  grenade_entity_id: number;
  thrower_steam_id_64: string | null;
  thrower_name: string | null;
}

export interface KillEventDto {
  type: "kill";
  data: {
    killer_steam_id_64: string | null;
    killer_name: string | null;
    victim_steam_id_64: string;
    victim_name: string;
    assister_steam_id_64: string | null;
    assister_name: string | null;
    weapon: string;
    is_headshot: boolean;
    penetrated_objects: number;
  };
}

export interface PlayerHurtEventDto {
  type: "player_hurt";
  data: {
    player_steam_id_64: string | null;
    player_name: string | null;
    attacker_steam_id_64: string | null;
    attacker_name: string | null;
    health_damage: number;
    armor_damage: number;
    weapon: string;
    hit_group: HitGroup;
  };
}

export interface WeaponFireEventDto {
  type: "weapon_fire";
  data: {
    shooter_steam_id_64: string | null;
    shooter_name: string | null;
    weapon: string;
  };
}

export interface WeaponReloadEventDto {
  type: "weapon_reload";
  data: {
    player_steam_id_64: string | null;
    player_name: string | null;
  };
}

export interface BombPlantedEventDto {
  type: "bomb_planted";
  data: {
    player_steam_id_64: string | null;
    player_name: string | null;
    site: BombSite;
  };
}

export interface BombDefusedEventDto {
  type: "bomb_defused";
  data: {
    player_steam_id_64: string | null;
    player_name: string | null;
  };
}

export interface BombExplodedEventDto {
  type: "bomb_exploded";
  data: { site: BombSite };
}

export interface BombDefuseStartEventDto {
  type: "bomb_defuse_start";
  data: {
    player_steam_id_64: string | null;
    player_name: string | null;
    has_kit: boolean;
  };
}

export interface BombDefuseAbortedEventDto {
  type: "bomb_defuse_aborted";
  data: {
    player_steam_id_64: string | null;
    player_name: string | null;
  };
}

export interface RoundStartEventDto {
  type: "round_start";
  data: { time_limit: number; frag_limit: number; objective: string };
}

export interface RoundEndEventDto {
  type: "round_end";
  data: { winner: RoundEndWinner; reason: string };
}

export interface RoundFreezetimeEndEventDto {
  type: "round_freezetime_end";
  data: Record<string, never>;
}

export interface RoundEndOfficialEventDto {
  type: "round_end_official";
  data: Record<string, never>;
}

export interface GrenadeThrowEventDto {
  type: "grenade_throw";
  data: GrenadePositionData & { weapon: string };
}

export interface GrenadeDestroyEventDto {
  type: "grenade_destroy";
  data: GrenadePositionData & { weapon: string };
}

export interface GrenadeFireStartEventDto {
  type: "grenade_fire_start";
  data: GrenadePositionData & { grenade_type: string };
}

export interface GrenadeFireEndEventDto {
  type: "grenade_fire_end";
  data: GrenadePositionData & { grenade_type: string };
}

export interface GrenadeHeExplodeEventDto {
  type: "grenade_he_explode";
  data: GrenadePositionData & { grenade_type: string };
}

export interface GrenadeFlashExplodeEventDto {
  type: "grenade_flash_explode";
  data: GrenadePositionData & { grenade_type: string };
}

export interface PlayerFlashedEventDto {
  type: "player_flashed";
  data: {
    player_steam_id_64: string | null;
    player_name: string | null;
    attacker_steam_id_64: string | null;
    flash_duration: number | null;
    player_team: TeamType | null;
    attacker_team: TeamType | null;
  };
}

export interface PlayerConnectEventDto {
  type: "player_connect";
  data: { steam_id_64: string; name: string };
}

export interface PlayerDisconnectEventDto {
  type: "player_disconnect";
  data: { steam_id_64: string; name: string };
}

export interface ItemPickupEventDto {
  type: "item_pickup";
  data: {
    player_steam_id_64: string | null;
    player_name: string | null;
    weapon: string;
    is_bought: boolean;
    weapon_entity_id: string | null;
  };
}

export interface ItemDropEventDto {
  type: "item_drop";
  data: {
    player_steam_id_64: string | null;
    player_name: string | null;
    weapon: string;
    weapon_entity_id: string | null;
  };
}

export interface ItemRefundEventDto {
  type: "item_refund";
  data: {
    player_steam_id_64: string | null;
    player_name: string | null;
    weapon: string;
    weapon_entity_id: string | null;
  };
}

export interface HostageRescuedEventDto {
  type: "hostage_rescued";
  data: {
    player_steam_id_64: string | null;
    player_name: string | null;
  };
}

export type DemoEventBase = {
  demoTick: number;
  gameTick: number;
};

export type DemoEventDto = DemoEventBase & (
  | KillEventDto
  | PlayerHurtEventDto
  | WeaponFireEventDto
  | WeaponReloadEventDto
  | BombPlantedEventDto
  | BombDefusedEventDto
  | BombExplodedEventDto
  | BombDefuseStartEventDto
  | BombDefuseAbortedEventDto
  | RoundStartEventDto
  | RoundEndEventDto
  | RoundFreezetimeEndEventDto
  | RoundEndOfficialEventDto
  | GrenadeThrowEventDto
  | GrenadeDestroyEventDto
  | GrenadeFireStartEventDto
  | GrenadeFireEndEventDto
  | GrenadeHeExplodeEventDto
  | GrenadeFlashExplodeEventDto
  | PlayerFlashedEventDto
  | PlayerConnectEventDto
  | PlayerDisconnectEventDto
  | ItemPickupEventDto
  | ItemDropEventDto
  | ItemRefundEventDto
  | HostageRescuedEventDto
);

export interface ReconnectionDto {
  steamId64: string;
  name: string;
  reconnectType: string;
}

export interface FrameDto {
  demoTick: number;
  gameTick: number;
  timestamp: number;
  playerStates: PlayerStateDto[];
  gameState: GameStateDto;
  events: DemoEventDto[];
  reconnections?: ReconnectionDto[];
}

export type SeekStep = 16 | 32 | 64 | 128;

export interface SeekRequestParams {
  matchId: string;
  startGameTick: number;
  endGameTick: number;
  step: SeekStep;
}

export type SeekResponseDto = ApiSuccessResponse<FrameDto[]>;
