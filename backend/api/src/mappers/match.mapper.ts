import { IMatch } from "@demo-viewer/database/dist/types/match.types";
import { MatchEntity, MatchOutcome, RoundInfo } from "@demo-viewer/domain/src/entities/MatchEntity";

type MatchInput = IMatch & { _id: { toString(): string } };

export function toMatchEntity(doc: MatchInput): MatchEntity {
  return {
    chunkCount: doc.chunk_count,
    clientName: doc.client_name,
    crawled: doc.crawled, // todo
    createdAt: doc.createdAt,
    datePlayed: doc.date_played,
    dateUploaded: doc.date_uploaded,
    demoId: doc.demo_id,
    duration: doc.duration,
    frameRate: doc.frame_rate,
    id: doc._id.toString(),
    mapId: doc.map_id,
    mapName: doc.map_name,
    parsedAt: doc.parsed_at,
    participants: doc.participants.map((p) => ({
      steamId: p.steam_id,
      userId: p.user_id,
      playerName: p.player_name,
      isBot: p.is_bot,
    })),
    playbackFrames: doc.playback_frames,
    playbackTicks: doc.playback_ticks,
    serverName: doc.server_name,
    signonLength: doc.signon_length,
    tickRate: doc.tick_rate,
    updatedAt: doc.updatedAt,
    visibleForAll: doc.visible_for_all,
    rounds: (doc.rounds ?? []).map((r): RoundInfo => ({
      roundNumber: r.round_number,
      winner: r.winner,
      startDemoTick: r.start_demo_tick,
      endDemoTick: r.end_demo_tick,
      startGameTick: r.start_game_tick,
      endGameTick: r.end_game_tick,
    })),
    outcome: doc.outcome
      ? ({ winner: doc.outcome.winner, tScore: doc.outcome.t_score, ctScore: doc.outcome.ct_score } satisfies MatchOutcome)
      : { winner: '', tScore: 0, ctScore: 0 },
  };
}
