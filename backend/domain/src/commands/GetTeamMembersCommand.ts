import type { GenericCommand } from "../lib/command_bus";
import type { GroupMemberEntity } from "../entities/GroupMemberEntity.ts";

export interface GetTeamMembersCommand extends GenericCommand<"get_team_members"> {
  groupId: string;
  requesterId: string;
}

export interface GetTeamMembersCommandResult {
  members: GroupMemberEntity[];
}
