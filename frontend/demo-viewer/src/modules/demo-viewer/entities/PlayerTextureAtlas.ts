import { TextureAtlas } from "../../../lib/TextureAtlas.ts";

type AtlasKeys =
  | "ct_pawn"
  | "ct_dead"
  | "t_pawn"
  | "t_dead"
  | "ct_pawn_direction"
  | "t_pawn_direction";

export class PlayerTextureAtlas extends TextureAtlas<AtlasKeys> {
  static override async create<T extends string = AtlasKeys>() {
    return super.create<T>(
      "/textures/player_atlas.json",
      "/textures/player_atlas.png",
    );
  }
}
