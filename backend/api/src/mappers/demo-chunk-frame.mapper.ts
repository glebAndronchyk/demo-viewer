import { IFrame } from "@demo-viewer/database/dist/types/demo_chunk.types";
import { Frame } from "@demo-viewer/domain/src/entities/DemoChunkEntity";

export function toDemoChunkFrame(f: IFrame): Frame {
  return {
    demoTick: f.demo_tick,
    gameTick: f.game_tick,
    timestamp: f.timestamp,
    playerStates: (f.player_states || []).map((p) => ({
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
    })),
    gameState: {
      roundNumber: f.game_state.round_number,
      phase: f.game_state.phase,
      ctScore: f.game_state.ct_score,
      tScore: f.game_state.t_score,
      timeRemaining: f.game_state.time_remaining,
      bombPlanted: f.game_state.bomb_planted,
      bombSite: f.game_state.bomb_site,
      bombTimeRemaining: f.game_state.bomb_time_remaining,
    },
    events: f.events.map((e) => ({
      type: e.type,
      data: e.data,
    })),
    reconnections: f.reconnections?.map((r) => ({
      steamId64: r.steam_id_64,
      name: r.name,
      reconnectType: r.reconnect_type,
    })),
  };
}
