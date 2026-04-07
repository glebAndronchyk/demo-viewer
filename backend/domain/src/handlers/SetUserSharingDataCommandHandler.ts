import type { DomainOutbound } from "../types/DomainOutbound.ts";
import {
  createRegistration,
  type GenericCommandHandler,
} from "../lib/command_bus";
import type {
  SetUserSharingDataCommand,
  SetUserSharingDataCommandResult,
} from "../commands/SetUserSharingDataCommand.ts";
import {
  DomainConflictError,
  DomainNotFoundError,
} from "../lib/errors/DomainErrors.ts";

export const setUserSharingDataCommandHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    SetUserSharingDataCommand,
    SetUserSharingDataCommandResult
  > = async (command) => {
    const userResult = await outbound.userRepository.getUserById(
      command.userId,
    );

    if (!userResult) {
      throw new DomainNotFoundError(`User not found: ${command.userId}`);
    }

    if (userResult.initialKnownShareCode && userResult.steamIdKey) {
      throw new DomainConflictError(
        "Sharing data already configured for this user",
      );
    }

    await outbound.userRepository.setUserSharingData({
      id: command.userId,
      steamIdKey: command.steamIdKey,
      knownShareCode: command.knownShareCode,
    });

    return { success: true };
  };

  handler.match = (c: object): c is SetUserSharingDataCommand => {
    return (
      "type" in c &&
      c.type ===
        ("set_user_sharing_data" satisfies SetUserSharingDataCommand["type"])
    );
  };

  return handler;
};

export const setUserSharingDataCommandRegistration = createRegistration<
  SetUserSharingDataCommand,
  SetUserSharingDataCommandResult
>("set_user_sharing_data", setUserSharingDataCommandHandler);

export default setUserSharingDataCommandRegistration;
