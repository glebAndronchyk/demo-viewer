import type { GenericCommand } from "../lib/command_bus";

export interface GetTeamMembersCommand extends GenericCommand<"get_team_members"> {
  groupId: string;
  requesterId: string;
}

export interface GetTeamMembersCommandResult {
  members: Array<{ memberId: string; userId: string; joinedAt: Date }>;
}
