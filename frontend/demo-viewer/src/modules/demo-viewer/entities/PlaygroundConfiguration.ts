import type { Euler } from "@react-three/fiber";
import type { Vector3 } from "../types/Vector3.ts";

export interface PlaygroundSurface {
  surfaceRotation: Euler;
  surfaceSize: [number, number];
}

export interface PlaygroundCamera {
  orthographicCameraPosition: [number, number, number];
  cameraZoom: number;
  frustumHeight: number;
}

export interface MapManifest {
  /**
   * Game Units in single px of 1024x1024 image
   */
  mapResolution: number;
  /**
   * Offset in game units from bottom left corner of texture to actual map origin placement (0,0)
   */
  mapOriginOffset: {
    x: number;
    y: number;
  };
}

type Playground = PlaygroundSurface & PlaygroundCamera & MapManifest;

export class PlaygroundConfiguration {
  constructor(readonly config: Playground) {}

  gamePointToWorldPoint(gameUnitPoint: Vector3): Vector3 {
    return this._toWorldPoint(
      this._invertVertically(this._toPixelWithOffset(gameUnitPoint)),
    );
  }

  private _toWorldPoint(point: Vector3): Vector3 {
    const halfSurfaceSize = [
      this.config.surfaceSize[0] / 2,
      this.config.surfaceSize[1] / 2,
    ];

    return {
      x: point.x - halfSurfaceSize[0],
      z: point.y - halfSurfaceSize[1], // z->y
      y: point.z, // y->z
    };
  }

  private _invertVertically(point: Vector3): Vector3 {
    return {
      ...point,
      y: this.config.surfaceSize[1] - point.y,
    };
  }

  private _toPixelWithOffset(point: Vector3): Vector3 {
    return {
      x: (point.x + this.config.mapOriginOffset.x) / this.config.mapResolution,
      y: (point.y + this.config.mapOriginOffset.y) / this.config.mapResolution,
      z: point.z,
    };
  }
}
