import type { UserOutboundPort } from "@demo-viewer/domain/src/ports/outbound/UserOutboundPort";
import { toUserEntity } from "../mappers/user.mapper";
import { UserEntity } from "@demo-viewer/domain/src/entities/UserEntity";
import { DatabaseService } from "../services/DatabaseService";
import { DomainNotFoundError } from "@demo-viewer/domain/src/lib/errors/DomainErrors";

export class UserRepository implements UserOutboundPort {
  constructor(private readonly database: DatabaseService) {}

  async getUserById(id: string): Promise<UserEntity | null> {
    const user = await this.database.UserModel.findById(id);

    return user ? toUserEntity(user) : null;
  }

  async resetUserShareCode(id: string) {
    const user = await this.database.UserModel.findById(id);

    if (!user) return;

    await this.database.UserModel.updateOne(
      {
        _id: id,
      },
      {
        latest_known_share_code: user.initial_known_share_code,
        share_code_verified_at: new Date(),
      },
    );
  }

  async updateKnownShareCode(id: string, shareCode: string | null | undefined) {
    if (!shareCode) return;

    await this.database.UserModel.updateOne(
      {
        _id: id,
      },
      {
        latest_known_share_code: shareCode,
        share_code_verified_at: new Date(),
      },
    );
  }

  async getUsersWithSharingData(
    offset: number,
    limit: number,
  ): Promise<UserEntity[]> {
    const users = await this.database.UserModel.find({
      steam_id_key: { $ne: null },
      latest_known_share_code: { $ne: null },
    })
      .skip(offset)
      .limit(limit);
    return users.map(toUserEntity);
  }

  async setUserSharingData(payload: {
    id: string;
    steamIdKey: string;
    knownShareCode: string;
  }): Promise<UserEntity> {
    const { knownShareCode, steamIdKey, id } = payload;

    const updateResult = await this.database.UserModel.findOneAndUpdate(
      { _id: payload.id },
      {
        $set: {
          latest_known_share_code: knownShareCode,
          initial_known_share_code: knownShareCode,
          steam_id_key: steamIdKey,
          share_code_verified_at: new Date(),
        },
      },
    );

    if (!updateResult) {
      throw new DomainNotFoundError(`User not found: ${id}`);
    }

    return toUserEntity(updateResult);
  }
}
