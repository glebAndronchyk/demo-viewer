import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type {
  SeekNextAvailableMatchForAnalyticsAggregationCommand,
  SeekNextAvailableMatchForAnalyticsAggregationCommandResult,
} from "../commands/SeekNextAvailableMatchForAnalyticsAggregationCommand.ts";
import { isValidMatchEntity } from "../entities/MatchEntity.ts";

export const seekNextAvailableMatchForAnalyticsAggregationHandler = (
  outbound: DomainOutbound,
) => {
  const handler: GenericCommandHandler<
    SeekNextAvailableMatchForAnalyticsAggregationCommand,
    SeekNextAvailableMatchForAnalyticsAggregationCommandResult
  > = async (command) => {
    const step = outbound.configuration.matchesForAnalyticsSeekStep;

    const matches = await outbound.matchRepository.getMatchesPerStep(
      command.seekIndex,
      step,
    );

    const mappedMatches = new Set(
      matches.filter(isValidMatchEntity).map((m) => m.id),
    );
    const actualAmountOfMatches = mappedMatches.size;

    const nextSeekIndex = command.seekIndex + actualAmountOfMatches;

    const alreadySeenMatches =
      await outbound.matchRepository.getAnalyzedMatchesFromSet(mappedMatches);

    return {
      matches: Array.from(mappedMatches.difference(alreadySeenMatches)),
      nextSeekIndex,
    };
  };

  handler.match = (
    c: object,
  ): c is SeekNextAvailableMatchForAnalyticsAggregationCommand => {
    return (
      "type" in c &&
      c.type ===
        ("seek_next_available_matches_for_analytics" satisfies SeekNextAvailableMatchForAnalyticsAggregationCommand["type"])
    );
  };

  return handler;
};

export const seekNextAvailableMatchForAnalyticsAggregationRegistration =
  createRegistration<
    SeekNextAvailableMatchForAnalyticsAggregationCommand,
    SeekNextAvailableMatchForAnalyticsAggregationCommandResult
  >(
    "seek_next_available_matches_for_analytics",
    seekNextAvailableMatchForAnalyticsAggregationHandler,
  );

export default seekNextAvailableMatchForAnalyticsAggregationRegistration;
