import { Elysia, sse } from "elysia";
import { CommandBusService } from "../adapters/CommandBusService.ts";
import { userPlugin } from "../lib/elysia/plugins/userPlugin.ts";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort.ts";
import type { GetUserNotificationsCommand } from "@demo-viewer/domain/src/commands/GetUserNotificationsCommand.ts";
import { NotificationEntity } from "@demo-viewer/domain/src/entities/NotificationEntity.ts";
import { NotificationOutboundPort } from "@demo-viewer/domain/src/ports/outbound/NotificationOutboundPort.ts";

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
          async function* ({ userId }) {
            yield sse({
              type: "init",
              data: await commandBus.dispatch<GetUserNotificationsCommand>({
                type: "get_user_notifications",
                status: "pending",
                userId,
              }),
            });

            let resolve: ((n: NotificationEntity) => void) | null = null;

            const unsub = notifications.subscribe(userId, (n) => {
              if (resolve && typeof resolve === "function") {
                resolve(n);
              }
            });

            try {
              const notification = await new Promise<NotificationEntity>(
                (res) => {
                  resolve = res;
                },
              );
              yield sse({ event: "update", data: notification });
            } finally {
              unsub();
            }
          },
        ),
      ),
    );
  }
}
