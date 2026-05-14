import { Elysia } from "elysia";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";
import { persist } from "../lib/elysia/plugins/persist";
import { cron } from "@elysiajs/cron";
import { LayeredAnalyticsCalculator } from "../repository/LayeredAnalyticsCalculator";
import { CommandBusService } from "../adapters/CommandBusService";
import { SeekNextAvailableMatchForAnalyticsAggregationCommand } from "@demo-viewer/domain/src/commands/SeekNextAvailableMatchForAnalyticsAggregationCommand";

interface CollectMatchAnalyticsCronState {
  analyticsSeekIndex: number;
  isAnalyticsRunning: boolean;
}

export class CollectMatchAnalyticsCron {
  constructor(
    app: Elysia,
    commandBus: CommandBusService,
    configuration: ConfigurationInboundPort,
    layeredAnalytics: LayeredAnalyticsCalculator,
  ) {
    app
      .state(
        persist({
          analyticsSeekIndex: 0,
          isAnalyticsRunning: false,
        } satisfies CollectMatchAnalyticsCronState),
      )
      .use(
        cron({
          name: "collectMatchAnalyticsCron",
          // pattern: "0 */1 * * * *", // todo scalable
          pattern: "*/10 * * * * *", // todo scalable
          async run() {
            const store = app.store as CollectMatchAnalyticsCronState;

            if (store.isAnalyticsRunning) {
              if (configuration.debug) {
                console.log(
                  `[CRON][CollectMatchAnalyticsCron] Halted because previous execution wasn't finished yet. seekIndex:${store.analyticsSeekIndex}`,
                );
              }

              return;
            }

            store.isAnalyticsRunning = true;

            const { matches, nextSeekIndex } =
              await commandBus.dispatch<SeekNextAvailableMatchForAnalyticsAggregationCommand>(
                {
                  type: "seek_next_available_matches_for_analytics",
                  seekIndex: store.analyticsSeekIndex,
                },
              );

            if (!matches.length) {
              store.isAnalyticsRunning = false;
              store.analyticsSeekIndex = nextSeekIndex;

              console.log(
                `[CRON][CollectMatchAnalyticsCron] No matches found to iterate over. index: ${store.analyticsSeekIndex}`,
              );
              return;
            }

            if (configuration.debug) {
              console.log(
                `[CRON][CollectMatchAnalyticsCron] Matches affected:${JSON.stringify(matches)}. nextSeekIndex:${nextSeekIndex}`,
              );
            }

            await Promise.all(
              matches.map((m) => layeredAnalytics.calculate(m)),
            );

            store.analyticsSeekIndex = nextSeekIndex;
            store.isAnalyticsRunning = false;
          },
        }),
      );
  }
}
