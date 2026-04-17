import type { GenericCommand } from "../lib/command_bus";

export interface SeekNextAvailableMatchForAnalyticsAggregationCommand extends GenericCommand<"seek_next_available_matches_for_analytics"> {
  seekIndex: number;
}

export interface SeekNextAvailableMatchForAnalyticsAggregationCommandResult {
  matches: string[];
  nextSeekIndex: number;
}
