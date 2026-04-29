import { CircleGeometry, Euler, Matrix4, Mesh, MeshBasicMaterial } from "three";
import type { Vector3 } from "../types/Vector3.ts";
import type { PlaygroundConfiguration } from "./PlaygroundConfiguration.ts";
import { tlerp } from "../../../lib/tlerp.ts";
import type { PlayerStateDto } from "@demo-viewer/shared-types";

export class PlayerPawnMesh extends Mesh {
  static readonly r = 10;
  static readonly s = 64;
  static readonly ctColor = 0x00c4ff;
  static readonly tColor = 0xff0000;
  static readonly neutralColor = 0x30ff00;
  private _pg: PlaygroundConfiguration | null = null;

  private _team: "CT" | "T" | null = null;
  private _moveTarget: Vector3 | null = null;
  private _moveFrom: Vector3 | null = null;
  private _moveTimeElapsed = 0;

  get pg() {
    if (!this._pg) throw new Error("Playground not defined");

    return this._pg;
  }

  static join(playground: PlaygroundConfiguration) {
    const mesh = new this(
      this.createGeom(playground),
      new MeshBasicMaterial({ color: this.neutralColor }),
    );
    mesh.withPlayground(playground);
    mesh.position.y = 1;
    return mesh;
  }

  static t(playground: PlaygroundConfiguration) {
    const mesh = new this(
      this.createGeom(playground),
      new MeshBasicMaterial({ color: this.tColor }),
    );
    mesh.withPlayground(playground);
    mesh.position.y = 1;
    return mesh;
  }

  static ct(playground: PlaygroundConfiguration) {
    const mesh = new this(
      this.createGeom(playground),
      new MeshBasicMaterial({ color: this.ctColor }),
    );
    mesh.withPlayground(playground);
    mesh.position.y = 1;
    return mesh;
  }

  withPlayground(playground: PlaygroundConfiguration) {
    this._pg = playground;
  }

  animate(delta: number, tickInterval: number) {
    this._moveTimeElapsed += delta;

    if (this._moveTarget && this._moveFrom) {
      const t = Math.min(this._moveTimeElapsed / tickInterval, 1);
      const [x, z] = tlerp(
        [this._moveFrom.x, this._moveFrom.z],
        [this._moveTarget.x, this._moveTarget.z],
        t,
      );

      this.position.x = x;
      this.position.z = z;
    }
  }

  teamSwitch(p: PlayerStateDto) {
    if (p.team !== this._team) {
      this.material = new MeshBasicMaterial({
        color: p.team === "CT" ? PlayerPawnMesh.ctColor : PlayerPawnMesh.tColor,
      });
    }
  }

  move(nextPositionGU: Vector3): void {
    const worldPos = this.pg.gamePointToWorldPoint(nextPositionGU);

    this._moveTimeElapsed = 0;
    this._moveTarget = worldPos;
    this._moveFrom = {
      x: this.position.x,
      z: this.position.z,
      y: this.position.y,
    };
  }

  shot() {
    // todo: shot
  }

  throw() {
    // todo: throw
  }

  drop() {
    // todo: drop
  }

  die() {
    // todo: die
  }

  jump() {
    // todo: jump
  }

  crouch() {
    // todo: jump
  }

  private static createGeom(playground: PlaygroundConfiguration) {
    const g = new CircleGeometry(this.r, this.s);
    const [rx, ry, rz] = playground.config.surfaceRotation as [
      number,
      number,
      number,
    ];
    g.applyMatrix4(new Matrix4().makeRotationFromEuler(new Euler(rx, ry, rz)));

    return g;
  }
}
