import { Euler, Matrix4, Mesh, MeshBasicMaterial, PlaneGeometry } from "three";
import type { Vector3 } from "../types/Vector3.ts";
import type { PlaygroundConfiguration } from "./PlaygroundConfiguration.ts";
import type { Animatable } from "../types/Animatable.ts";

export class Bomb extends Mesh implements Animatable {
  static readonly size = 20;
  static readonly color = 0xff0000;

  get shouldDestroy() {
    return false;
  }

  timing(_tick: number): void {
    void _tick;
  }

  isAnimatable(_currentTick: number): {
    animate(delta: number, tickInterval: number): void;
  } | null {
    void _currentTick;
    return this;
  }

  animate(_delta: number, _tickInterval: number): void {
    void _delta;
    void _tickInterval;
  }

  static create(playground: PlaygroundConfiguration, position: Vector3): Bomb {
    const geometry = new PlaneGeometry(this.size, this.size);
    const [rx, ry, rz] = playground.config.surfaceRotation as [
      number,
      number,
      number,
    ];
    geometry.applyMatrix4(
      new Matrix4().makeRotationFromEuler(new Euler(rx, ry, rz)),
    );

    const material = new MeshBasicMaterial({ color: this.color });
    const bomb = new this(geometry, material);

    const worldPos = playground.gamePointToWorldPoint(position);
    bomb.position.set(worldPos.x, 1, worldPos.z);

    return bomb;
  }
}
