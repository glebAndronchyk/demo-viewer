import { Elysia } from "elysia";
import { CommandBusService } from "../adapters/CommandBusService";

export class TeamController {
  constructor(app: Elysia, commandBus: CommandBusService) {
    app.use(new Elysia({ prefix: "/team" }));
  }
}
