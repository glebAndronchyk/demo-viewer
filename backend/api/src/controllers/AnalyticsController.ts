import { Elysia } from "elysia";
import { CreateTeamCommand } from "@demo-viewer/domain/src/commands";
import { CommandBusService } from "../services/CommandBusService";

export class AnalyticsController {
  constructor(app: Elysia, commandBus: CommandBusService) {
    app.use(
      new Elysia({ prefix: "/analytics" }).get("/", async () => {
        await commandBus.dispatch<CreateTeamCommand>({
          name: "test",
          type: "create_team",
        });

        return {
          chemistry: 1,
        };
      }),
    );
  }
}
