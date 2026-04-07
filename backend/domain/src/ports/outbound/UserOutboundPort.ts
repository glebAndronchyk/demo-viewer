import type { UserEntity } from "../../entities/UserEntity.ts";

export interface UserOutboundPort {
  getUserById(id: string): Promise<UserEntity | null>;
  setUserSharingData(payload: {
    id: string;
    steamIdKey: string;
    knownShareCode: string;
  }): Promise<UserEntity>;
  updateKnownShareCode: (id: string, shareCode: string) => Promise<void>;
  resetUserShareCode: (id: string) => Promise<void>;
}
