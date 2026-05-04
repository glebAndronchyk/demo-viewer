import type { DomainOutbound } from "../types/DomainOutbound.ts";
import {
  createRegistration,
  type GenericCommandHandler,
} from "../lib/command_bus";
import type {
  UpdateUserSharingDataCommand,
  UpdateUserSharingDataCommandResult,
} from "../commands/UpdateUserSharingDataCommand.ts";
import { DomainNotFoundError } from "../lib/errors/DomainErrors.ts";

export const updateUserSharingDataCommandHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    UpdateUserSharingDataCommand,
    UpdateUserSharingDataCommandResult
  > = async (command) => {
    const userResult = await outbound.userRepository.getUserById(command.userId);

    if (!userResult) {
      throw new DomainNotFoundError(`User not found: ${command.userId}`);
    }

    await outbound.userRepository.setUserSharingData({
      id: command.userId,
      steamIdKey: command.steamIdKey,
      knownShareCode: command.knownShareCode,
    });

    return { success: true };
  };

  handler.match = (c: object): c is UpdateUserSharingDataCommand => {
    return (
      "type" in c &&
      c.type === ("update_user_sharing_data" satisfies UpdateUserSharingDataCommand["type"])
    );
  };

  return handler;
};

export const updateUserSharingDataCommandRegistration = createRegistration<
  UpdateUserSharingDataCommand,
  UpdateUserSharingDataCommandResult
>("update_user_sharing_data", updateUserSharingDataCommandHandler);

export default updateUserSharingDataCommandRegistration;
