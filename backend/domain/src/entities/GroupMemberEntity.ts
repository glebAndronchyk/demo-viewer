import type { UserEntity } from "./UserEntity.ts";

export interface GroupMemberEntity {
  id: string;
  userId: string;
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: UserEntity | null;
}
