import type { PlaygroundConfiguration } from "../entities/PlaygroundConfiguration.ts";
import type { Line, Mesh } from "three";
import { Tick } from "@demo-viewer/shared-entities";

export interface ViewerState {
  finalBufferedTick: number;
  currentTick: number;
  speed: number;
  bufferingWindow: number;
  isBuffering: boolean;
  tickRate: Tick;
  state: "pause" | "play";
  geometries: Map<string, Mesh | Line>;
  /**
   * Delay in ticks between different shots. Used scheduling different shots for "sequential firing" behavior
   */
  crossTracerDelay: number;
  playground: PlaygroundConfiguration;
}
