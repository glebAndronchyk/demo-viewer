import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";
import { DownloadAndParseDemoCommand } from "@demo-viewer/domain/src/commands/DownloadAndParseDemoCommand";
import { CommandBusService } from "../adapters/CommandBusService";
import { persist } from "../lib/elysia/plugins/persist";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";

interface CollectMatchFromUserCronState {
  seekIndex: number;
}

interface CronState {
  isRunningLock: boolean;
}

export class CollectMatchesFromUserCron {
  constructor(
    app: Elysia,
    commandBus: CommandBusService,
    configuration: ConfigurationInboundPort,
  ) {
    app
      .state(persist({ seekIndex: 0 } satisfies CollectMatchFromUserCronState))
      .state({ isRunningLock: false } satisfies CronState)
      .use(
        cron({
          name: "collectMatchesFromUserCron",
          // pattern: "0 */1 * * * *", // todo scalable
          pattern: "*/10 * * * * *", // todo scalable
          async run() {
            const store = app.store as CollectMatchFromUserCronState &
              CronState;

            if (store.isRunningLock) {
              if (configuration.debug) {
                console.log(
                  `[CRON][CollectMatchesFromUserCron] Halted because previous execution wasn't finished yet. seekIndex:${store.seekIndex}`,
                );
              }

              return;
            }

            store.isRunningLock = true;

            const { users, nextSeekIndex } = await commandBus.dispatch({
              type: "seek_next_available_code_of_next_users",
              seekIndex: store.seekIndex,
            });

            if (configuration.debug) {
              console.log(
                `[CRON][CollectMatchesFromUserCron] Users affected:${JSON.stringify(users)}. nextSeekIndex:${nextSeekIndex}`,
              );
            }

            store.seekIndex = nextSeekIndex;

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

            store.isRunningLock = false;
          },
        }),
      );
  }
}
