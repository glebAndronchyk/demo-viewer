import { Elysia, t } from "elysia";
import { CommandBusService } from "../services/CommandBusService";
import { DownloadAndParseDemoCommand } from "@demo-viewer/domain/src/commands/DownloadAndParseDemoCommand";
import { UserRepository } from "../repository/UserRepository";

export class MaintenanceController {
  constructor(
    app: Elysia,
    commandBus: CommandBusService,
    userRepository: UserRepository,
  ) {
    app.use(
      new Elysia({ prefix: "/maintenance" })
        .post(
          "/parse/:userId",
          async ({ params: { userId }, status }) => {
            const user = await userRepository.getUserById(userId);

            if (!user || !user.latestKnownShareCode || !user.steamIdKey) {
              return status(400);
            }

            await commandBus.dispatch<DownloadAndParseDemoCommand>({
              userId: user.id,
              lastKnownShareCode: user.latestKnownShareCode,
              userSteamId: user.steamId,
              userSteamIdKey: user.steamIdKey,
              type: "download_and_parse_demo",
            });

            return {
              chemistry: 1,
            };
          },
          {
            params: t.Object({
              userId: t.String(),
            }),
          },
        )
        .put(
          "/user/:userId/reset-share-code",
          async ({ params: { userId }, status }) => {
            await userRepository.resetUserShareCode(userId);
          },
          {
            params: t.Object({
              userId: t.String(), // todo: unify schema
            }),
          },
        ),
    );
  }
}
