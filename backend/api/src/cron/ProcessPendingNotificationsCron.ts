import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";
import { CommandBusService } from "../adapters/CommandBusService";

interface CronState {
  isNotificationsRunning: boolean;
}

export class ProcessPendingNotificationsCron {
  constructor(app: Elysia, commandBus: CommandBusService) {
    app
      .state({ isNotificationsRunning: false } satisfies CronState)
      .use(
        cron({
          name: "processNotificationsCron",
          pattern: "*/5 * * * * *",
          async run() {
            const store = app.store as CronState;

            if (store.isNotificationsRunning) return;

            store.isNotificationsRunning = true;
            try {
              await commandBus.dispatch({
                type: "process_pending_notifications",
                batchSize: 20,
              });
            } catch (e) {
              console.log(`[CRON][ProcessPendingNotificationsCron][ERROR] ${e}`);
            } finally {
              store.isNotificationsRunning = false;
            }
          },
        }),
      );
  }
}
