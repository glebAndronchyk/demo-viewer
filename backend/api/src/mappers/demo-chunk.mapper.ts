import { IDemoChunk } from "@demo-viewer/database/dist/types/demo_chunk.types";
import { DemoChunkEntity } from "@demo-viewer/domain/src/entities/DemoChunkEntity";
import { toDemoChunkFrame } from "./demo-chunk-frame.mapper";

export function toDemoChunkEntity(doc: IDemoChunk): DemoChunkEntity {
  return {
    messageType: doc.message_type,
    demoId: doc.demo_id,
    chunkIndex: doc.chunk_index,
    startTick: doc.start_tick,
    endTick: doc.end_tick,
    startGameTick: doc.start_game_tick,
    endGameTick: doc.end_game_tick,
    frames: doc.frames.map(toDemoChunkFrame),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}