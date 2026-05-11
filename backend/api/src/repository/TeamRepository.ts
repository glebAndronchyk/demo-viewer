import { GroupModel, GroupMemberModel } from "@demo-viewer/database";
import type { TeamOutboundPort } from "@demo-viewer/domain/src/ports/outbound/TeamOutboundPort";
import type { GroupEntity } from "@demo-viewer/domain/src/entities/GroupEntity";
import type { GroupMemberEntity } from "@demo-viewer/domain/src/entities/GroupMemberEntity";
import { toGroupEntity, toGroupMemberEntity } from "../mappers/group.mapper";
import {
  DomainConflictError,
  DomainNotFoundError,
} from "@demo-viewer/domain/src/lib/errors/DomainErrors";
import { Types } from "mongoose";

export class TeamRepository implements TeamOutboundPort {
  async createTeam(name: string, ownerId: string): Promise<GroupEntity> {
    const group = await GroupModel.create({
      name,
      owner_id: ownerId,
      is_open: false,
    });
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

  async getTeamsByOwnerId(ownerId: string): Promise<GroupEntity[]> {
    const groups = await GroupModel.find({ owner_id: ownerId }).lean();
    return groups.map(toGroupEntity);
  }

  async getGroupsMemberOf(userId: string): Promise<GroupEntity[]> {
    const userObjectId = new Types.ObjectId(userId);
    const memberships = await GroupMemberModel.find({
      user_id: userObjectId,
    }).lean();
    const groupIds = memberships.map((m) => m.group_id);
    const groups = await GroupModel.find({
      _id: { $in: groupIds },
      owner_id: { $ne: userId },
    }).lean();
    return groups.map(toGroupEntity);
  }

  async addMember(groupId: string, userId: string): Promise<GroupMemberEntity> {
    try {
      const member = await GroupMemberModel.create({
        group_id: new Types.ObjectId(groupId),
        user_id: new Types.ObjectId(userId),
      });
      return toGroupMemberEntity(member);
    } catch (err: any) {
      if (err.code === 11000) {
        throw new DomainConflictError("User is already a member of this team");
      }
      throw err;
    }
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    const result = await GroupMemberModel.deleteOne({
      group_id: new Types.ObjectId(groupId),
      user_id: new Types.ObjectId(userId),
    });
    if (result.deletedCount === 0) {
      throw new DomainNotFoundError("Member not found in team");
    }
  }

  async getMembers(groupId: string): Promise<GroupMemberEntity[]> {
    const members = await GroupMemberModel.aggregate([
      {
        $match: { group_id: new Types.ObjectId(groupId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    ]);
    return members.map(toGroupMemberEntity);
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const count = await GroupMemberModel.countDocuments({
      group_id: new Types.ObjectId(groupId),
      user_id: new Types.ObjectId(userId),
    });
    return count > 0;
  }

  async updateTeam(
    id: string,
    updates: { name?: string; isOpen?: boolean },
  ): Promise<GroupEntity> {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.isOpen !== undefined) dbUpdates.is_open = updates.isOpen;

    const group = await GroupModel.findByIdAndUpdate(
      id,
      { $set: dbUpdates },
      { new: true },
    ).lean();
    if (!group) throw new DomainNotFoundError(`Team not found: ${id}`);
    return toGroupEntity(group);
  }
}
