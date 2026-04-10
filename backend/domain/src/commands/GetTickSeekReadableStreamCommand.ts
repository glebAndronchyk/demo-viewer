import type { GenericCommand } from "../lib/command_bus";
import type { DemoChunkEntity } from "../entities/DemoChunkEntity.ts";

export interface GetTickSeekReadableStreamCommand extends GenericCommand<"get_tick_seek_readable_stream"> {
  matchId: string;
  startGameTick: number;
  endGameTick: number;
  step: number;
}

export interface GetTickSeekReadableStreamCommandResult {
  frames: DemoChunkEntity["frames"];
}
