import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import { DomainNotFoundError } from "../lib/errors/DomainErrors.ts";
import type {
  GetTickSeekReadableStreamCommand,
  GetTickSeekReadableStreamCommandResult,
} from "../commands/GetTickSeekReadableStreamCommand.ts";

export const getTickSeekReadableStreamCommandHandler = (
  outbound: DomainOutbound,
) => {
  const handler: GenericCommandHandler<
    GetTickSeekReadableStreamCommand,
    GetTickSeekReadableStreamCommandResult
  > = async (command) => {
    const match = await outbound.matchRepository.findByMatchId(command.matchId);

    if (!match) {
      throw new DomainNotFoundError(
        `Match with id:${command.matchId} not found`,
      );
    }

    const ticksInRange = await outbound.matchRepository.getTicksRange({
      startGameTick: command.startGameTick,
      endGameTick: command.endGameTick,
      step: command.step,
      demoId: match.demoId,
    });

    if (!ticksInRange || !ticksInRange.length) {
      throw new DomainNotFoundError(
        `No ticks in provided range. ${JSON.stringify(command)}`,
      );
    }

    return { frames: ticksInRange };
  };

  handler.match = (c: object): c is GetTickSeekReadableStreamCommand => {
    return (
      "type" in c &&
      c.type ===
        ("get_tick_seek_readable_stream" satisfies GetTickSeekReadableStreamCommand["type"])
    );
  };

  return handler;
};

export const getTickSeekReadableStreamCommandRegistration = createRegistration<
  GetTickSeekReadableStreamCommand,
  GetTickSeekReadableStreamCommandResult
>("get_tick_seek_readable_stream", getTickSeekReadableStreamCommandHandler);

export default getTickSeekReadableStreamCommandRegistration;
