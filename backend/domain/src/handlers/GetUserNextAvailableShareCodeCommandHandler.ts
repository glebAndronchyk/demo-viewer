import type { DomainOutbound } from "../types/DomainOutbound.ts";
import {
  createRegistration,
  type GenericCommandHandler,
} from "../lib/command_bus";
import type {
  GetUserNextAvailableShareCodeCommand,
  GetUserNextAvailableShareCodeCommandResult,
} from "../commands/GetUserNextAvailableShareCodeCommand.ts";
import {
  DomainConflictError,
  DomainNotFoundError,
} from "../lib/errors/DomainErrors.ts";

export const getUserNextAvailableShareCodeCommandHandler = (
  outbound: DomainOutbound,
) => {
  const handler: GenericCommandHandler<
    GetUserNextAvailableShareCodeCommand,
    GetUserNextAvailableShareCodeCommandResult
  > = async (command) => {
    const userResult = await outbound.userRepository.getUserById(
      command.userId,
    );

    if (!userResult) {
      throw new DomainNotFoundError(`User not found: ${command.userId}`);
    }

    let latestKnownShareCode =
      userResult.latestKnownShareCode || userResult.initialKnownShareCode;

    if (!latestKnownShareCode || !userResult.steamIdKey) {
      throw new DomainConflictError("User has no sharing data configured");
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
