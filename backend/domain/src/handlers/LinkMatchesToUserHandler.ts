import type {
  LinkMatchesToUserCommand,
  LinkMatchesToUserCommandResult,
} from "../commands/LinkMatchesToUserCommand.ts";
import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";

export const linkMatchesToUserHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    LinkMatchesToUserCommand,
    LinkMatchesToUserCommandResult
  > = async (command) => {
    const linkedCount = await outbound.authRepository.linkMatchesToUser(
      command.steamId,
      command.userId,
    );

    return { linkedCount } satisfies LinkMatchesToUserCommandResult;
  };

  handler.match = (c: object): c is LinkMatchesToUserCommand => {
    return (
      "type" in c &&
      c.type ===
        ("link_matches_to_user" satisfies LinkMatchesToUserCommand["type"])
    );
  };

  return handler;
};

export const linkMatchesToUserRegistration = createRegistration<
  LinkMatchesToUserCommand,
  LinkMatchesToUserCommandResult
>("link_matches_to_user", linkMatchesToUserHandler);

export default linkMatchesToUserRegistration;
