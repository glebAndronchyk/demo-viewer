import { SignJWT } from "jose";
import { UserModel, MatchModel } from "@demo-viewer/database";
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
    return {
      id: (user._id as { toString(): string }).toString(),
      steam_id: user.steam_id,
      createdAt: user.createdAt,
    };
  }

  async createUser(steamId: string): Promise<UserRecord> {
    const user = await UserModel.create({ steam_id: steamId });
    return {
      id: (user._id as { toString(): string }).toString(),
      steam_id: user.steam_id,
      createdAt: user.createdAt,
    };
  }

  async linkMatchesToUser(steamId: string, userId: string): Promise<number> {
    const result = await MatchModel.updateMany(
      { "participants.steam_id": steamId },
      { $set: { "participants.$[elem].user_id": userId } },
      { arrayFilters: [{ "elem.steam_id": steamId }] },
    );
    return result.modifiedCount;
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
