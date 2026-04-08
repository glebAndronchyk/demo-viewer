import type {
  RegisterOrLoginWithSteamCommand,
  RegisterOrLoginWithSteamCommandResult,
} from "../commands/RegisterOrLoginWithSteamCommand.ts";
import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";

export const registerOrLoginWithSteamHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    RegisterOrLoginWithSteamCommand,
    RegisterOrLoginWithSteamCommandResult
  > = async (command) => {
    const existing = await outbound.authRepository.findUserBySteamId(
      command.steamId,
    );
    console.log(command);
    const user =
      existing ?? (await outbound.authRepository.createUser(command.steamId));
    const isNewUser = existing === null;

    const token = await outbound.authRepository.signJwt({
      sub: user.id,
      steamId: user.steam_id,
    });

    return {
      userId: user.id,
      steamId: user.steam_id,
      isNewUser,
      token,
    } satisfies RegisterOrLoginWithSteamCommandResult;
  };

  handler.match = (c: object): c is RegisterOrLoginWithSteamCommand => {
    return (
      "type" in c &&
      c.type ===
        ("register_or_login_with_steam" satisfies RegisterOrLoginWithSteamCommand["type"])
    );
  };

  return handler;
};

export const registerOrLoginWithSteamRegistration = createRegistration<
  RegisterOrLoginWithSteamCommand,
  RegisterOrLoginWithSteamCommandResult
>("register_or_login_with_steam", registerOrLoginWithSteamHandler);

export default registerOrLoginWithSteamRegistration;
