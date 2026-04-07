import type { DomainOutbound } from "../types/DomainOutbound.ts";
import {
  createRegistration,
  type GenericCommandHandler,
} from "../lib/command_bus";
import type {
  GetUserNextAvailableShareCodeCommand,
  GetUserNextAvailableShareCodeCommandResult,
} from "../commands/GetUserNextAvailableShareCodeCommand.ts";

export const getUserNextAvailableShareCodeCommandHandler = (
  outbound: DomainOutbound,
) => {
  // todo add decorator to catch error and remap it to BaseResponse
  const handler: GenericCommandHandler<
    GetUserNextAvailableShareCodeCommand,
    GetUserNextAvailableShareCodeCommandResult
  > = async (command) => {
    const userResult = await outbound.userRepository.getUserById(
      command.userId,
    );

    if (!userResult) {
      return { shareCode: null };
    }

    let latestKnownShareCode =
      userResult.latestKnownShareCode || userResult.initialKnownShareCode;

    if (!latestKnownShareCode || !userResult.steamIdKey) {
      return { shareCode: null }; // todo: error handling
    }

    const codeResult =
      await outbound.gameCoordinatorRepository.getNextAvailableShareCode(
        userResult.steamId,
        userResult.steamIdKey,
        latestKnownShareCode,
      );

    await outbound.userRepository.updateKnownShareCode(
      userResult.id,
      codeResult.data.nextCode,
    );

    return { shareCode: codeResult.data.nextCode };
  };

  handler.match = (c: object): c is GetUserNextAvailableShareCodeCommand => {
    return (
      "type" in c &&
      c.type ===
        ("get_user_next_available_share_code" satisfies GetUserNextAvailableShareCodeCommand["type"])
    );
  };

  return handler;
};

export const getUserNextAvailableShareCodeRegistration = createRegistration<
  GetUserNextAvailableShareCodeCommand,
  GetUserNextAvailableShareCodeCommandResult
>(
  "get_user_next_available_share_code",
  getUserNextAvailableShareCodeCommandHandler,
);

export default getUserNextAvailableShareCodeRegistration;
