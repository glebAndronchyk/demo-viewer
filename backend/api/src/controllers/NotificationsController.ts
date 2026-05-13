import { Elysia, sse } from "elysia";
import { CommandBusService } from "../adapters/CommandBusService.ts";
import { userPlugin } from "../lib/elysia/plugins/userPlugin.ts";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort.ts";
import type { GetUserNotificationsCommand } from "@demo-viewer/domain/src/commands/GetUserNotificationsCommand.ts";
import { NotificationOutboundPort } from "@demo-viewer/domain/src/ports/outbound/NotificationOutboundPort.ts";
import type { NotificationEntity } from "@demo-viewer/domain/src/entities/NotificationEntity.ts";

export class NotificationsController {
  constructor(
    app: Elysia,
    commandBus: CommandBusService,
    configuration: ConfigurationInboundPort,
    notifications: NotificationOutboundPort,
  ) {
    app.use(
      new Elysia({ prefix: "/notifications", tags: ["notifications"] }).use(
        userPlugin(configuration.jwtSecret).get(
          "/session",
          async function* ({ sub }) {
            yield sse({
              event: "init",
              data: await commandBus.dispatch<GetUserNotificationsCommand>({
                type: "get_user_notifications",
                status: "pending",
                userId: sub,
              }),
            });

            const queue: NotificationEntity[] = [];
            let resolve: ((n: NotificationEntity) => void) | null = null;

            const unsub = notifications.subscribe(sub, (n) => {
              if (resolve) {
                const r = resolve;
                resolve = null;
                r(n);
              } else {
                queue.push(n);
              }
            });

            const next = () =>
              new Promise<NotificationEntity>((res) => {
                if (queue.length > 0) {
                  res(queue.shift()!);
                } else {
                  resolve = res;
                }
              });

            try {
              while (true) {
                yield sse({ event: "update", data: await next() });
              }
            } finally {
              unsub();
            }
          },
        ),
      ),
    );
  }
}
