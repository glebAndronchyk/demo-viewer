import {
  ClampToEdgeWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from "three";

interface AtlasFrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface AtlasFrameEntry {
  frame: AtlasFrameRect;
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: AtlasFrameRect;
  sourceSize: { w: number; h: number };
}

interface AtlasJson<T extends string> {
  frames: Record<T, AtlasFrameEntry>;
  meta: {
    image: string;
    size: { w: number; h: number };
    [k: string]: unknown;
  };
}

export class TextureAtlas<T extends string> {
  private readonly _cache: Map<T, Texture>;

  protected constructor(
    private readonly _base: Texture,
    private readonly _json: AtlasJson<T>,
  ) {
    this._cache = new Map(
      Object.keys(_json.frames).map((frameName) => [
        frameName as T,
        this._buildFrameTexture(frameName as T),
      ]),
    );
  }

  static async create<T extends string>(
    jsonUrl: string,
    imageUrlOverride?: string,
  ): Promise<TextureAtlas<T>> {
    const json: AtlasJson<T> = await fetch(jsonUrl).then((r) => r.json());

    const baseDir = jsonUrl.substring(0, jsonUrl.lastIndexOf("/") + 1);
    const imageUrl = imageUrlOverride ?? baseDir + json.meta.image;

    const base = await new TextureLoader().loadAsync(imageUrl);
    base.colorSpace = SRGBColorSpace;
    base.wrapS = ClampToEdgeWrapping;
    base.wrapT = ClampToEdgeWrapping;
    base.needsUpdate = true;

    return new TextureAtlas<T>(base, json);
  }

  get(frameName: T): Texture {
    const cached = this._cache.get(frameName);
    if (!cached) throw new Error(`Unknown atlas frame: ${frameName}`);
    return cached;
  }

  dispose(): void {
    this._cache.forEach((t) => t.dispose());
    this._base.dispose();
  }

  private _buildFrameTexture(frameName: T): Texture {
    const entry = this._json.frames[frameName];
    const { w: atlasW, h: atlasH } = this._json.meta.size;
    const { x, y, w, h } = entry.frame;

    const t = this._base.clone();
    t.repeat.set(w / atlasW, h / atlasH);
    t.offset.set(x / atlasW, 1 - y / atlasH - h / atlasH);

    if (entry.rotated) {
      t.rotation = -Math.PI / 2;
      t.center.set(0.5, 0.5);
    }

    t.needsUpdate = true;
    return t;
  }
}
