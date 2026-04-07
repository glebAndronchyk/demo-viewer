import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DownloadAndParseDemoCommand } from "../commands/DownloadAndParseDemoCommand.ts";
import { DomainUnavailableError } from "../lib/errors/DomainErrors.ts";

export const downloadAndParseDemoCommandHandler = (
  outbound: DomainOutbound,
) => {
  const handler: GenericCommandHandler<
    DownloadAndParseDemoCommand,
    never
  > = async (command) => {
    const nextCodeResult =
      await outbound.gameCoordinatorRepository.getNextAvailableShareCode(
        command.userSteamId,
        command.userSteamIdKey,
        command.lastKnownShareCode,
      );

    if (!nextCodeResult.isSuccess) {
      throw nextCodeResult.error;
    }

    await outbound.userRepository.updateKnownShareCode(
      command.userId,
      nextCodeResult.data.nextCode,
    );

    const matchUrlResult =
      await outbound.gameCoordinatorRepository.getMatchUrlById(
        nextCodeResult.data.nextCode,
      );

    const pingResult = await outbound.gameCoordinatorRepository.pingMatchUrl(
      matchUrlResult.data.url,
    );

    if (!pingResult.isSuccess) {
      throw new DomainUnavailableError(
        pingResult.error?.message ?? "Demo not available for download",
      );
    }

    await outbound.parserRepository.parseDemoFromRemote(
      matchUrlResult.data.url,
    );

    return {} as never;
  };

  handler.match = (c: object): c is DownloadAndParseDemoCommand => {
    return (
      "type" in c &&
      c.type ===
        ("download_and_parse_demo" satisfies DownloadAndParseDemoCommand["type"])
    );
  };

  return handler;
};

export const downloadAndParseDemoRegistration = createRegistration<
  DownloadAndParseDemoCommand,
  never
>("download_and_parse_demo", downloadAndParseDemoCommandHandler);

export default downloadAndParseDemoRegistration;
