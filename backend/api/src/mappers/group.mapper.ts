import type { IGroup, IGroupMember, IUser } from "@demo-viewer/database";
import type { GroupEntity } from "@demo-viewer/domain/src/entities/GroupEntity";
import type { GroupMemberEntity } from "@demo-viewer/domain/src/entities/GroupMemberEntity";
import { toUserEntity, UserInput } from "./user.mapper.ts";

type GroupInput = IGroup & { _id: { toString(): string } };
type GroupMemberInput = IGroupMember & { _id: { toString(): string } } & {
  user?: UserInput;
};

export function toGroupEntity(doc: GroupInput): GroupEntity {
  return {
    id: doc._id.toString(),
    name: doc.name,
    ownerId: doc.owner_id,
    isOpen: doc.is_open,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function toGroupMemberEntity(doc: GroupMemberInput): GroupMemberEntity {
  return {
    id: doc._id.toString(),
    userId: doc.user_id.toString(),
    groupId: doc.group_id,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    user: doc.user ? toUserEntity(doc.user) : null,
  };
}
