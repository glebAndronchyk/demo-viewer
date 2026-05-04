import type { GenericCommand } from "../lib/command_bus";

export interface UpdateUserSharingDataCommand extends GenericCommand<"update_user_sharing_data"> {
  userId: string;
  knownShareCode: string;
  steamIdKey: string;
}

export interface UpdateUserSharingDataCommandResult {
  success: true;
}