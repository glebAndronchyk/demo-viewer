import { Elysia, t } from "elysia";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";
import { userPlugin } from "../lib/elysia/plugins/userPlugin";
import { CommandBusService } from "../adapters/CommandBusService";
import { SetUserSharingDataCommand } from "@demo-viewer/domain/src/commands/SetUserSharingDataCommand";

export class UserController {
  constructor(
    app: Elysia,
    configuration: ConfigurationInboundPort,
    commandBus: CommandBusService,
  ) {
    app.use(
      new Elysia({ prefix: "user/:id", tags: ["user"] })
        .use(userPlugin(configuration.jwtSecret))
        .get("/next-available-share-code", async ({ params: { id } }) => {
          const result = await commandBus.dispatch({
            type: "get_user_next_available_share_code",
            userId: id,
          });

          return { data: { shareCode: result.shareCode }, error: null, isSuccess: true };
        })
        .put(
          "/set-user-sharing-data",
          async ({ params: { id }, body }) => {
            await commandBus.dispatch<SetUserSharingDataCommand>({
              type: "set_user_sharing_data",
              userId: id,
              knownShareCode: body.knownShareCode,
              steamIdKey: body.steamIdKey,
            });

            return { data: null, error: null, isSuccess: true };
          },
          {
            body: t.Object({
              steamIdKey: t.String(),
              knownShareCode: t.String(),
            }),
          },
        ),
    );
  }
}
