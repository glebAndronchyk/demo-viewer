import { GroupModel, GroupMemberModel } from "@demo-viewer/database";
import type { TeamOutboundPort } from "@demo-viewer/domain/src/ports/outbound/TeamOutboundPort";
import type { GroupEntity } from "@demo-viewer/domain/src/entities/GroupEntity";
import type { GroupMemberEntity } from "@demo-viewer/domain/src/entities/GroupMemberEntity";
import { toGroupEntity, toGroupMemberEntity } from "../mappers/group.mapper";
import {
  DomainConflictError,
  DomainNotFoundError,
} from "@demo-viewer/domain/src/lib/errors/DomainErrors";

export class TeamRepository implements TeamOutboundPort {
  async createTeam(name: string, ownerId: string): Promise<GroupEntity> {
    const group = await GroupModel.create({ name, owner_id: ownerId, is_open: false });
    return toGroupEntity(group);
  }

  async getTeamById(id: string): Promise<GroupEntity | null> {
    const group = await GroupModel.findById(id).lean();
    return group ? toGroupEntity(group) : null;
  }

  async getTeamByOwnerId(ownerId: string): Promise<GroupEntity | null> {
    const group = await GroupModel.findOne({ owner_id: ownerId }).lean();
    return group ? toGroupEntity(group) : null;
  }

  async addMember(groupId: string, userId: string): Promise<GroupMemberEntity> {
    try {
      const member = await GroupMemberModel.create({ group_id: groupId, user_id: userId });
      return toGroupMemberEntity(member);
    } catch (err: any) {
      if (err.code === 11000) {
        throw new DomainConflictError("User is already a member of this team");
      }
      throw err;
    }
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    const result = await GroupMemberModel.deleteOne({ group_id: groupId, user_id: userId });
    if (result.deletedCount === 0) {
      throw new DomainNotFoundError("Member not found in team");
    }
  }

  async getMembers(groupId: string): Promise<GroupMemberEntity[]> {
    const members = await GroupMemberModel.find({ group_id: groupId }).lean();
    return members.map(toGroupMemberEntity);
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const count = await GroupMemberModel.countDocuments({ group_id: groupId, user_id: userId });
    return count > 0;
  }

  async updateTeam(id: string, updates: { name?: string; isOpen?: boolean }): Promise<GroupEntity> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.isOpen !== undefined) dbUpdates.is_open = updates.isOpen;

    const group = await GroupModel.findByIdAndUpdate(id, { $set: dbUpdates }, { new: true }).lean();
    if (!group) throw new DomainNotFoundError(`Team not found: ${id}`);
    return toGroupEntity(group);
  }
}
