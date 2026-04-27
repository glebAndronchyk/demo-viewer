export class Tick {
  private updateRate: number = 0;
  private _tick: number = 0;

  static rate(t: number) {
    const i = new this();

    i.updateRate = t;
    return i;
  }

  asSecond() {
    return this._tick / this.updateRate;
  }

  tick(t: number) {
    this._tick = t;
    return this;
  }

  oneSecond() {
    return this.ticksInSeconds(1);
  }

  ticksInSeconds(s: number) {
    return s * this.updateRate;
  }
}
