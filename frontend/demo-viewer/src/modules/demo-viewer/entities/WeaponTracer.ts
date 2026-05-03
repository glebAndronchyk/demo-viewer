import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import type { Vector3 } from "../types/Vector3";
import type { Animatable } from "../types/Animatable.ts";
import { tlerp } from "../../../lib/tlerp.ts";

export class WeaponTracer extends Line2 implements Animatable {
  private _direction: Vector3 | null = null;
  private _executionTick: number | null = null;
  private _lifeEndsAtTick: number | null = null;
  private _shouldDestroy = false;
  private _animTimeElapsed = 0;
  private _origin: Vector3 | null = null;

  get shouldDestroy(): boolean {
    return this._shouldDestroy;
  }

  get executionTick() {
    if (!this._executionTick) throw new Error("ExecutionTick is not defined");

    return this._executionTick;
  }

  get lifeEndsAtTick() {
    if (!this._lifeEndsAtTick) throw new Error("LifeEndAtTick is not defined");

    return this._lifeEndsAtTick;
  }

  // TODO: accept WeaponTypeDto for per-weapon visual differentiation (color, length, etc.)
  static create(
    origin: Vector3,
    direction: Vector3,
    executionTick: number,
    lifeEndsAtTick: number,
  ) {
    const geometry = new LineGeometry();
    geometry.setPositions([0, 0, 0, 0, 0, 0]);

    const material = new LineMaterial({
      color: 0xffffff,
      linewidth: 2,
      worldUnits: false,
    });

    const obj = new this(geometry, material);

    obj.setDirection(direction);
    obj.setExecutionTick(executionTick);
    obj.setLifeEndsAtTick(lifeEndsAtTick);
    obj._origin = { x: origin.x, y: origin.y, z: origin.z };
    obj.position.set(origin.x, origin.y, origin.z);

    return obj;
  }

  reconstructFromFrame() {
    this._shouldDestroy = true; // always clear tracers
  }

  timing(tick: number) {
    try {
      if (tick >= this.lifeEndsAtTick) {
        this._shouldDestroy = true;
      }
    } catch {
      return void undefined;
    }
  }

  isAnimatable(currentTick: number): {
    animate(delta: number, tickInterval: number): void;
  } | null {
    try {
      if (currentTick >= this.executionTick) {
        return this;
      }
    } catch {
      return null;
    }

    return null;
  }

  get direction() {
    if (!this._direction) throw new Error("Direction is null");

    return this._direction;
  }

  setDirection(direction: Vector3) {
    this._direction = direction;
  }

  setExecutionTick(tick: number) {
    this._executionTick = tick;
  }

  setLifeEndsAtTick(tick: number) {
    this._lifeEndsAtTick = tick;
  }

  animate(delta: number, tickInterval: number) {
    if (!this._origin) return;

    this._animTimeElapsed += delta;
    const t = Math.min((this._animTimeElapsed / tickInterval) * 3, 1);
    const maxDist = 1024; // todo: based on playground
    const dir = this.direction;

    const [x, z] = tlerp(
      [this._origin.x, this._origin.z],
      [this._origin.x + dir.x * maxDist, this._origin.z - dir.y * maxDist],
      t,
    );

    this.position.z = z;
    this.position.x = x;

    const endX = (dir.x * maxDist) / 4;
    const endZ = (-dir.y * maxDist) / 4;
    (this.geometry as LineGeometry).setPositions([0, 0, 0, endX, 0, endZ]);
  }

  setResolution(width: number, height: number) {
    (this.material as LineMaterial).resolution.set(width, height);
  }
}
