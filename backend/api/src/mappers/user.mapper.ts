import type { IUser } from "@demo-viewer/database";
import type { UserEntity } from "@demo-viewer/domain/src/entities/UserEntity";

type UserInput = IUser & { _id: { toString(): string } };

export function toUserEntity(doc: UserInput): UserEntity {
  return {
    id: doc._id.toString(),
    steamId: doc.steam_id,
    steamIdKey: doc.steam_id_key,
    latestKnownShareCode: doc.latest_known_share_code ?? null,
    initialKnownShareCode: doc.initial_known_share_code ?? null,
    shareCodeVerifiedAt: doc.share_code_verified_at ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
