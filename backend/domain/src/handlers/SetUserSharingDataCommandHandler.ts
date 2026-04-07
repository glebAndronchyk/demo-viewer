import type { DomainOutbound } from "../types/DomainOutbound.ts";
import {
  createRegistration,
  type GenericCommandHandler,
} from "../lib/command_bus";
import type {
  SetUserSharingDataCommand,
  SetUserSharingDataCommandResult,
} from "../commands/SetUserSharingDataCommand.ts";

export const setUserSharingDataCommandHandler = (outbound: DomainOutbound) => {
  // todo add decorator to catch error and remap it to BaseResponse
  const handler: GenericCommandHandler<
    SetUserSharingDataCommand,
    SetUserSharingDataCommandResult
  > = async (command) => {
    const userResult = await outbound.userRepository.getUserById(
      command.userId,
    );

    if (!userResult) {
      return { success: false };
    }

    if (userResult.initialKnownShareCode && userResult.steamIdKey) {
      return { success: false };
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
