import type { FrameDto } from "@demo-viewer/shared-types";

export interface Animatable {
  animate(delta: number, tickInterval: number): void;
  isAnimatable(currentTick: number): {
    animate(delta: number, tickInterval: number): void;
  } | null;
  timing(tick: number): void;
  reconstructFromFrame(frame: FrameDto): void;
  shouldDestroy: boolean;
}

export const isAnimatableInterface = (obj: unknown): obj is Animatable => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    obj !== undefined &&
    "animate" in obj &&
    "isAnimatable" in obj
  );
};
