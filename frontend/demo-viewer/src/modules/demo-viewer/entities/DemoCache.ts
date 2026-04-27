import type { FrameDto } from "@demo-viewer/shared-types";

export class DemoCache {
  constructor(
    private readonly l1Source: Map<number, FrameDto>,
    private readonly l2Source: unknown,
    private readonly capacity: number,
  ) {}

  async store(frames: FrameDto[]) {
    if (this.l1Source.size + frames.length <= this.capacity) {
      frames.forEach((frame: FrameDto) => {
        this.l1Source.set(frame.gameTick, frame);
      });

      return this;
    }

    if (this.l1Source.size + frames.length > this.capacity) {
      const existingTicks = Array.from(this.l1Source.keys());
      const lastTickToRemove =
        existingTicks[existingTicks.length - frames.length - 1]; // identify cache window edge

      existingTicks.forEach((tick) => {
        // remove all ticks that doesn't fit cache window (shifted by incoming frames)
        if (tick <= lastTickToRemove) {
          // this.l2Source
          this.l1Source.delete(tick); // todo: preserve in l2 cache
        }
      });

      frames.forEach((frame: FrameDto) => {
        this.l1Source.set(frame.gameTick, frame);
      });
    }

    return this;
  }

  async getByTick(t: number) {
    return this.l1Source.get(t);
    // return this.l1Source.get(t) ?? (await this.l2Source.get(t));
  }

  l1GetFinalAvailableFrame() {
    let final: [number, FrameDto] = [] as never;

    for (final of this.l1Source);

    return final[1];
  }
}
