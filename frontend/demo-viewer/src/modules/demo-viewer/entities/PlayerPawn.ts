import { CircleGeometry, Euler, Matrix4, Mesh, MeshBasicMaterial } from "three";
import type { Vector3 } from "../types/Vector3.ts";
import type { PlaygroundConfiguration } from "./PlaygroundConfiguration.ts";
import { tlerp } from "../../../lib/tlerp.ts";
import type {
  FrameDto,
  KillEventDto,
  PlayerStateDto,
  WeaponFireEventDto,
} from "@demo-viewer/shared-types";
import { WeaponTracer } from "./WeaponTracer.ts";
import type { Animatable } from "../types/Animatable.ts";
import type { PlayerTextureAtlas } from "./PlayerTextureAtlas.ts";

export class PlayerPawn extends Mesh implements Animatable {
  static readonly r = 14;
  static readonly s = 64;
  static readonly neutralColor = 0x30ff00; // todo: neutral mesh
  private _pg: PlaygroundConfiguration | null = null;
  private _textureAtlas: PlayerTextureAtlas | null = null;

  private _key: string | null = null;
  private _team: "CT" | "T" | null = null;
  private _moveTarget: Vector3 | null = null;
  private _moveFrom: Vector3 | null = null;
  private _dieTick: number | null = null;
  private _dead: boolean = false;
  private _shouldDestroy: boolean = false;
  private _moveTimeElapsed = 0;

  static join(
    key: string,
    playground: PlaygroundConfiguration,
    textureAtlas: PlayerTextureAtlas,
  ) {
    const mesh = new this(
      this.createGeom(playground),
      new MeshBasicMaterial({ color: this.neutralColor }),
    );
    mesh._key = key;
    mesh.withPlayground(playground);
    mesh.setTextureAtlas(textureAtlas);

    mesh.position.y = 1;
    return mesh;
  }

  static t(
    key: string,
    playground: PlaygroundConfiguration,
    textureAtlas: PlayerTextureAtlas,
  ) {
    const mesh = new this(
      this.createGeom(playground),
      new MeshBasicMaterial({
        map: textureAtlas.get("t_pawn"),
        transparent: true,
      }),
    );
    mesh._key = key;
    mesh.withPlayground(playground);
    mesh.position.y = 1;
    return mesh;
  }

  static ct(
    key: string,
    playground: PlaygroundConfiguration,
    textureAtlas: PlayerTextureAtlas,
  ) {
    const mesh = new this(
      this.createGeom(playground),
      new MeshBasicMaterial({
        map: textureAtlas.get("ct_pawn"),
        transparent: true,
      }),
    );
    mesh._key = key;
    mesh.withPlayground(playground);
    mesh.position.y = 1;
    return mesh;
  }

  get key(): string {
    if (!this._key) throw new Error("Player key not specified");

    return this._key;
  }

  get textureAtlas(): PlayerTextureAtlas {
    if (!this._textureAtlas) throw new Error("Texture atlas not defined");

    return this._textureAtlas;
  }

  get pg() {
    if (!this._pg) throw new Error("Playground not defined");

    return this._pg;
  }

  get shouldDestroy() {
    return this._shouldDestroy;
  }

  reconstructFromFrame(frame: FrameDto) {
    const framePlayer = frame.playerStates.find(
      (p) => p.steamId64 === this._key,
    );

    if (!framePlayer) {
      this._shouldDestroy = true;
      return;
    }

    if (framePlayer.isAlive) {
      this.resurrect();
    } else {
      this.die({ gameTick: frame.gameTick } as KillEventDto); // die on current tick
    }

    const framePlayerPos = this.pg.gamePointToWorldPoint(framePlayer.position);

    this._moveTimeElapsed = 0;
    this._moveTarget = null;
    this._moveFrom = null;
    this._team = framePlayer.team as typeof this._team;

    this.position.x = framePlayerPos.x;
    this.position.z = framePlayerPos.z;
  }

  timing(tick: number) {
    this._dieTiming(tick);
  }

  isAnimatable(currentTick: number): {
    animate(delta: number, tickInterval: number): void;
  } | null {
    void currentTick;
    return this;
  }

  withPlayground(playground: PlaygroundConfiguration) {
    this._pg = playground;
  }

  setTextureAtlas(textureAtlas: PlayerTextureAtlas) {
    this._textureAtlas = textureAtlas;
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
      this._team = p.team as typeof this._team;
      this.material = new MeshBasicMaterial({
        map: this.textureAtlas.get(p.team === "CT" ? "ct_pawn" : "t_pawn"),
        transparent: true,
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

  shot(evt: WeaponFireEventDto, shootingOffset: number): WeaponTracer {
    const startTick = evt.gameTick + shootingOffset;
    const endTick = startTick + shootingOffset;

    return WeaponTracer.create(
      { x: this.position.x, y: this.position.y, z: this.position.z },
      evt.data.direction,
      startTick,
      endTick,
    );
  }

  throw() {
    // todo: throw
  }

  drop() {
    // todo: drop
  }

  resurrect() {
    this._dieTick = null;
    this._dead = false;

    const castedMaterial = this.material as MeshBasicMaterial;

    castedMaterial.map = this.textureAtlas.get(
      this._team === "CT" ? "ct_pawn" : "t_pawn",
    );
    castedMaterial.needsUpdate = true;
  }

  die(evt: KillEventDto, offset: number = 0) {
    this._dieTick = evt.gameTick + offset;
  }

  jump() {
    // todo: jump
  }

  crouch() {
    // todo: jump
  }

  private _dieTiming(tick: number) {
    const delta = (this._dieTick ?? 0) - tick;
    if (this._dead || !this._dieTick || delta > 2) return;

    const castedMaterial = this.material as MeshBasicMaterial;
    castedMaterial.map = this.textureAtlas.get(
      this._team === "CT" ? "ct_dead" : "t_dead",
    );

    castedMaterial.needsUpdate = true;
    this._dead = true;
    this._dieTick = null;
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
