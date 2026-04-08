import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type {
  SeekNextAvailableCodeOfNextUsersCommand,
  SeekNextAvailableCodeOfNextUsersCommandResult,
} from "../commands/SeekNextAvailableCodeOfNextUsersCommand.ts";

export const seekNextAvailableCodeOfNextUsersCommandHandler = (
  outbound: DomainOutbound,
) => {
  const handler: GenericCommandHandler<
    SeekNextAvailableCodeOfNextUsersCommand,
    SeekNextAvailableCodeOfNextUsersCommandResult
  > = async (command) => {
    const step = outbound.configuration.shareCodeSeekStep;

    const users = await outbound.userRepository.getUsersWithSharingData(
      command.seekIndex,
      step,
    );

    const mappedUsers = users.map((user) => ({
      userId: user.id,
      userSteamId: user.steamId,
      userSteamIdKey: user.steamIdKey!,
      lastKnownShareCode: user.latestKnownShareCode!,
    }));

    const nextSeekIndex = users.length === step ? command.seekIndex + step : 0;

    return { users: mappedUsers, nextSeekIndex };
  };

  handler.match = (c: object): c is SeekNextAvailableCodeOfNextUsersCommand => {
    return (
      "type" in c &&
      c.type ===
        ("seek_next_available_code_of_next_users" satisfies SeekNextAvailableCodeOfNextUsersCommand["type"])
    );
  };

  return handler;
};

export const seekNextAvailableCodeOfNextUsersRegistration = createRegistration<
  SeekNextAvailableCodeOfNextUsersCommand,
  SeekNextAvailableCodeOfNextUsersCommandResult
>(
  "seek_next_available_code_of_next_users",
  seekNextAvailableCodeOfNextUsersCommandHandler,
);

export default seekNextAvailableCodeOfNextUsersRegistration;
