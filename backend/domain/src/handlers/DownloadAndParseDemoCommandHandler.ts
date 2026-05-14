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
    let code: string = command.lastKnownShareCode;
    const [isMatchSeen, isShareCodeCorrupted] = await Promise.all([
      outbound.matchRepository.isMatchWithShareCodeExists(
        command.lastKnownShareCode,
      ),
      outbound.gameCoordinatorRepository.isShareCodeCorrupted(
        command.lastKnownShareCode,
      ),
    ]);

    if (isMatchSeen || isShareCodeCorrupted) {
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
      code = nextCodeResult.data.nextCode;
    }

    const matchUrlResult =
      await outbound.gameCoordinatorRepository.getMatchUrlById(code);

    if (!matchUrlResult.isSuccess) {
      throw matchUrlResult.error;
    }

    const existingMatch = await outbound.matchRepository.findByShareCode(code);

    if (existingMatch) {
      console.log(
        `[DownloadAndParseDemo] Share code ${code} already parsed, skipping.`,
      );
      return { url: null };
    }

    const pingResult = await outbound.gameCoordinatorRepository.pingMatchUrl(
      matchUrlResult.data.url,
    );

    if (!pingResult.isSuccess) {
      await outbound.gameCoordinatorRepository.markShareCodeAsCorrupted(code);

      throw new DomainUnavailableError(
        pingResult.error?.message ?? "Demo not available for download",
      );
    }

    await outbound.queue.enqueue(
      () =>
        outbound.parserRepository.parseDemoFromRemote(
          matchUrlResult.data.url,
          code,
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
