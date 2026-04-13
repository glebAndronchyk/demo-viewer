import { IFrame } from "@demo-viewer/database/dist/types/demo_chunk.types";
import { Frame } from "@demo-viewer/domain/src/entities/DemoChunkEntity";
import { toPlayerStateEntity } from "./player-state.mapper";

export function toDemoChunkFrame(f: IFrame): Frame {
  return {
    demoTick: f.demo_tick,
    gameTick: f.game_tick,
    timestamp: f.timestamp,
    playerStates: (f.player_states || []).map(toPlayerStateEntity),
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
