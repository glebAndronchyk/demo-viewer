import { SignJWT } from "jose";
import { UserModel, MatchModel } from "@demo-viewer/database";
import { toUserEntity } from "../mappers/user.mapper";
import type {
  AuthOutboundPort,
  UserRecord,
} from "@demo-viewer/domain/src/ports/outbound/AuthOutboundPort";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";

export class AuthRepository implements AuthOutboundPort {
  private readonly secretKey: Uint8Array;

  constructor(private readonly configuration: ConfigurationInboundPort) {
    this.secretKey = new TextEncoder().encode(this.configuration.jwtSecret);
  }

  async findUserBySteamId(steamId: string): Promise<UserRecord | null> {
    const user = await UserModel.findOne({ steam_id: steamId }).lean();
    if (!user) return null;
    const entity = toUserEntity(user);
    return { id: entity.id, steam_id: entity.steamId, createdAt: entity.createdAt };
  }

  async createUser(steamId: string): Promise<UserRecord> {
    // findOneAndUpdate with upsert is safe on Cosmos DB: avoids the find→insert race
    // and returns the existing doc on conflict instead of throwing E11000.
    const user = await UserModel.findOneAndUpdate(
      { steam_id: steamId },
      { $setOnInsert: { steam_id: steamId } },
      { upsert: true, new: true },
    );
    const entity = toUserEntity(user!);
    return { id: entity.id, steam_id: entity.steamId, createdAt: entity.createdAt };
  }

  async linkMatchesToUser(steamId: string, userId: string): Promise<number> {
    // Cosmos DB does not support arrayFilters — update each matching doc individually.
    const matches = await MatchModel.find(
      { "participants.steam_id": steamId },
      { _id: 1 },
    ).lean();

    if (matches.length === 0) return 0;

    const results = await Promise.all(
      matches.map((m) =>
        MatchModel.updateOne(
          { _id: m._id, "participants.steam_id": steamId },
          { $set: { "participants.$.user_id": userId } },
        ),
      ),
    );

    return results.reduce((sum, r) => sum + r.modifiedCount, 0);
  }

  signJwt(payload: { sub: string; steamId: string }): Promise<string> {
    return new SignJWT({ steamId: payload.steamId })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(payload.sub)
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(this.secretKey);
  }
}
