import { Elysia, t } from "elysia";
import { CommandBusService } from "../adapters/CommandBusService";
import { DownloadAndParseDemoCommand } from "@demo-viewer/domain/src/commands/DownloadAndParseDemoCommand";
import { UserRepository } from "../repository/UserRepository";
import {
  BadRequestError,
  ResourceNotFoundError,
} from "../lib/errors/AppErrors";

export class MaintenanceController {
  constructor(
    app: Elysia,
    commandBus: CommandBusService,
    userRepository: UserRepository,
  ) {
    app.use(
      new Elysia({ prefix: "/maintenance", tags: ["maintenance"] })
        .post(
          "/parse/:userId",
          async ({ params: { userId } }) => {
            const user = await userRepository.getUserById(userId);

            if (!user) {
              throw new ResourceNotFoundError("User", userId);
            }

            if (!user.latestKnownShareCode || !user.steamIdKey) {
              throw new BadRequestError("User has no sharing data configured");
            }

            await commandBus.dispatch<DownloadAndParseDemoCommand>({
              userId: user.id,
              lastKnownShareCode: user.latestKnownShareCode,
              userSteamId: user.steamId,
              userSteamIdKey: user.steamIdKey,
              type: "download_and_parse_demo",
            });

            return { data: { chemistry: 1 }, error: null, isSuccess: true };
          },
          {
            params: t.Object({
              userId: t.String(),
            }),
          },
        )
        .put(
          "/user/:userId/reset-share-code",
          async ({ params: { userId } }) => {
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
