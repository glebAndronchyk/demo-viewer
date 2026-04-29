import type { PlaygroundConfiguration } from "../entities/PlaygroundConfiguration.ts";
import type { Mesh } from "three";
import { Tick } from "@demo-viewer/shared-entities";

export interface ViewerState {
  finalBufferedTick: number;
  currentTick: number;
  speed: number;
  bufferingWindow: number;
  tickRate: Tick;
  state: "pause" | "play";
  geometries: Map<string, Mesh>;
  playground: PlaygroundConfiguration;
}
