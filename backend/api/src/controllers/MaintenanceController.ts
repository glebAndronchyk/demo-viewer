import { Elysia } from "elysia";
import { CommandBusService } from "../services/CommandBusService";
import { DownloadAndParseDemoCommand } from "@demo-viewer/domain/src/commands/DownloadAndParseDemoCommand";

export class MaintenanceController {
  constructor(app: Elysia, commandBus: CommandBusService) {
    app.use(
      new Elysia({ prefix: "/maintenance" }).get("/parse", async () => {
        await commandBus.dispatch<DownloadAndParseDemoCommand>({
          lastKnownShareCode: "",
          userSteamId: "",
          userSteamIdKey: "",
          type: "download_and_parse_demo",
        });

        return {
          chemistry: 1,
        };
      }),
    );
  }
}
