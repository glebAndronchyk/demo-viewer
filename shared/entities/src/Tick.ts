export class Tick {
  private _updateRate: number = 0;
  private _tick: number = 0;

  get updateRate() {
    return this._updateRate;
  }

  static rate(t: number) {
    const i = new this();

    i._updateRate = t;
    return i;
  }

  asSecond() {
    return this._tick / this._updateRate;
  }

  tick(t: number) {
    this._tick = t;
    return this;
  }

  oneSecond() {
    return this.ticksInSeconds(1);
  }

  ticksInSeconds(s: number) {
    return s * this._updateRate;
  }
}
