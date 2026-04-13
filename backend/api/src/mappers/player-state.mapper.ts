import { IPlayerState } from "@demo-viewer/database/dist/types/demo_chunk.types";
import { PlayerState } from "@demo-viewer/domain/src/entities/DemoChunkEntity";

export function toPlayerStateEntity(p: IPlayerState): PlayerState {
  return {
    steamId64: p.steam_id_64,
    name: p.name,
    userId: p.user_id,
    team: p.team,
    position: p.position,
    viewDirection: p.view_direction,
    velocity: p.velocity,
    hp: p.hp,
    armor: p.armor,
    hasHelmet: p.has_helmet,
    hasDefuseKit: p.has_defuse_kit,
    money: p.money,
    currentEquipment: {
      activeWeapon: p.current_equipment.active_weapon,
      weapons: p.current_equipment.weapons,
      grenades: p.current_equipment.grenades,
    },
    isAlive: p.is_alive,
    isBot: p.is_bot,
    isConnected: p.is_connected,
    isDucking: p.is_ducking,
    isDefusing: p.is_defusing,
    isPlanting: p.is_planting,
    isReloading: p.is_reloading,
    isScoped: p.is_scoped,
    isWalking: p.is_walking,
    flashDuration: p.flash_duration,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    score: p.score,
    mvps: p.mvps,
  };
}