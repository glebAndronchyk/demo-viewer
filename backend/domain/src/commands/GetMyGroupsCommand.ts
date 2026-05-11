import type { GenericCommand } from "../lib/command_bus";

export interface GetMyGroupsCommand extends GenericCommand<"get_my_groups"> {
  requesterId: string;
}

export interface GetMyGroupsCommandResult {
  owned: Array<{ id: string; name: string; isOpen: boolean; createdAt: Date }>;
  joined: Array<{ id: string; name: string; ownerId: string; isOpen: boolean; createdAt: Date }>;
}
