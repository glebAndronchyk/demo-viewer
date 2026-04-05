import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";
import { DownloadAndParseDemoCommand } from "@demo-viewer/domain/src/commands/DownloadAndParseDemoCommand";
import { CommandBusService } from "../services/CommandBusService";

export class CollectMatchesFromUserCron {
  constructor(app: Elysia, commandBus: CommandBusService) {
    app.use(
      cron({
        name: "collectMatchesFromUserCron",
        pattern: "* */5 * * * *",
        async run() {
          // const codes = await commandBus.dispatch({
          //   type: "get_users_latest_share_codes",
          // });
          //
          // // todo: think about workers pool
          // await Promise.all(
          //   codes.map((code) =>
          //     commandBus.dispatch<DownloadAndParseDemoCommand>({
          //       type: "download_and_parse_demo",
          //       userSteamId: code.userSteamId,
          //       userSteamIdKey: code.userSteamIdKey,
          //       lastKnownShareCode: code.lastKnownShareCode,
          //     }),
          //   ),
          // );
        },
      }),
    );
  }
}
