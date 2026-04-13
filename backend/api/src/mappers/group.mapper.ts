import type { IGroup, IGroupMember } from "@demo-viewer/database";
import type { GroupEntity } from "@demo-viewer/domain/src/entities/GroupEntity";
import type { GroupMemberEntity } from "@demo-viewer/domain/src/entities/GroupMemberEntity";

type GroupInput = IGroup & { _id: { toString(): string } };
type GroupMemberInput = IGroupMember & { _id: { toString(): string } };

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
    userId: doc.user_id,
    groupId: doc.group_id,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
