import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";
import { DownloadAndParseDemoCommand } from "@demo-viewer/domain/src/commands/DownloadAndParseDemoCommand";
import { CommandBusService } from "../adapters/CommandBusService";
import { persist } from "../lib/elysia/plugins/persist";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";

interface CollectMatchFromUserCronState {
  parsingSeekIndex: number;
}

interface CronState {
  isParsingRunning: boolean;
}

export class CollectMatchesFromUserCron {
  constructor(
    app: Elysia,
    commandBus: CommandBusService,
    configuration: ConfigurationInboundPort,
  ) {
    app
      .state(
        persist({
          parsingSeekIndex: 0,
        } satisfies CollectMatchFromUserCronState),
      )
      .state({ isParsingRunning: false } satisfies CronState)
      .use(
        cron({
          name: "collectMatchesFromUserCron",
          // pattern: "0 */1 * * * *", // todo scalable
          pattern: "*/10 * * * * *", // todo scalable
          async run() {
            if (configuration.preventParsing) return;

            const store = app.store as CollectMatchFromUserCronState &
              CronState;

            if (store.isParsingRunning) {
              if (configuration.debug) {
                console.log(
                  `[CRON][CollectMatchesFromUserCron] Halted because previous execution wasn't finished yet. seekIndex:${store.parsingSeekIndex}`,
                );
              }

              return;
            }

            store.isParsingRunning = true;

            const { users, nextSeekIndex } = await commandBus.dispatch({
              type: "seek_next_available_code_of_next_users",
              seekIndex: store.parsingSeekIndex,
            });

            if (configuration.debug) {
              console.log(
                `[CRON][CollectMatchesFromUserCron] Users affected:${JSON.stringify(users)}. nextSeekIndex:${nextSeekIndex}`,
              );
            }

            store.parsingSeekIndex = nextSeekIndex;

            await Promise.all(
              users.map((u) =>
                commandBus
                  .dispatch<DownloadAndParseDemoCommand>({
                    type: "download_and_parse_demo",
                    userId: u.userId,
                    userSteamId: u.userSteamId,
                    userSteamIdKey: u.userSteamIdKey,
                    lastKnownShareCode: u.lastKnownShareCode,
                  })
                  .catch((e) => console.log(`[CRON][ERROR] ${e}`)),
              ),
            );

            store.isParsingRunning = false;
          },
        }),
      );
  }
}
