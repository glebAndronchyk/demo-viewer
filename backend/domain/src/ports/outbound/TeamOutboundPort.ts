import type { GroupEntity } from "../../entities/GroupEntity.ts";
import type { GroupMemberEntity } from "../../entities/GroupMemberEntity.ts";

export interface TeamOutboundPort {
  createTeam(name: string, ownerId: string): Promise<GroupEntity>;
  getTeamById(id: string): Promise<GroupEntity | null>;
  getTeamByOwnerId(ownerId: string): Promise<GroupEntity | null>;
  getTeamsByOwnerId(ownerId: string): Promise<GroupEntity[]>;
  getGroupsMemberOf(userId: string): Promise<GroupEntity[]>;
  addMember(groupId: string, userId: string): Promise<GroupMemberEntity>;
  removeMember(groupId: string, userId: string): Promise<void>;
  getMembers(groupId: string): Promise<GroupMemberEntity[]>;
  isMember(groupId: string, userId: string): Promise<boolean>;
  updateTeam(id: string, updates: { name?: string; isOpen?: boolean }): Promise<GroupEntity>;
}
