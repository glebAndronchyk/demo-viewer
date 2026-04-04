import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DownloadAndParseDemoCommand } from "../commands/DownloadAndParseDemoCommand.ts";

export const downloadAndParseDemoCommandHandler = (
  outbound: DomainOutbound,
) => {
  // todo add decorator to catch error and remap it to BaseResponse
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

    const matchUrlResult =
      await outbound.gameCoordinatorRepository.getMatchUrlById(
        nextCodeResult.data.nextCode,
      );

    // todo: background parsing task
    await outbound.parserRepository.parseDemoFromRemote(
      matchUrlResult.data.url,
    );
    // todo: background parsing task

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
