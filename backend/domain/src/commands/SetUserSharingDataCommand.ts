import type { GenericCommand } from "../lib/command_bus";

export interface SetUserSharingDataCommand extends GenericCommand<"set_user_sharing_data"> {
  userId: string;
  knownShareCode: string;
  steamIdKey: string;
}

export interface SetUserSharingDataCommandResult {
  success: boolean; // todo better base repsonse
}
