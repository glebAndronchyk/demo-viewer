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

export function toDemoChunkModel(
  entity: Partial<DemoChunkEntity>,
): Partial<IDemoChunk> {
  return {
    chunk_index: entity.chunkIndex,
    createdAt: entity.createdAt,
    demo_id: entity.demoId,
    end_game_tick: entity.endGameTick,
    end_tick: entity.endTick,
    frames: [], // todo
    message_type: entity.messageType,
    start_game_tick: entity.startGameTick,
    start_tick: entity.startTick,
    updatedAt: entity.updatedAt,
  };
}
