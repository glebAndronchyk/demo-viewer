import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type {
  DownloadAndParseDemoCommand,
  DownloadAndParseDemoCommandResult,
} from "../commands/DownloadAndParseDemoCommand.ts";
import { DomainUnavailableError } from "../lib/errors/DomainErrors.ts";

export const downloadAndParseDemoCommandHandler = (
  outbound: DomainOutbound,
) => {
  const handler: GenericCommandHandler<
    DownloadAndParseDemoCommand,
    DownloadAndParseDemoCommandResult
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

    if (!matchUrlResult.isSuccess) {
      throw matchUrlResult.error;
    }

    const existingMatch = await outbound.matchRepository.findByShareCode(
      nextCodeResult.data.nextCode,
    );

    if (existingMatch) {
      console.log(
        `[DownloadAndParseDemo] Share code ${nextCodeResult.data.nextCode} already parsed, skipping.`,
      );
      return { url: null };
    }

    const pingResult = await outbound.gameCoordinatorRepository.pingMatchUrl(
      matchUrlResult.data.url,
    );

    if (!pingResult.isSuccess) {
      throw new DomainUnavailableError(
        pingResult.error?.message ?? "Demo not available for download",
      );
    }

    await outbound.queue.enqueue(
      () =>
        outbound.parserRepository.parseDemoFromRemote(
          matchUrlResult.data.url,
          nextCodeResult.data.nextCode,
        ).promise,
    );

    return {
      url: matchUrlResult.data.url,
    };
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
  DownloadAndParseDemoCommandResult
>("download_and_parse_demo", downloadAndParseDemoCommandHandler);

export default downloadAndParseDemoRegistration;
