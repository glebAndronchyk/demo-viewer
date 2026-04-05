import { Elysia } from "elysia";
import { CommandBusService } from "../services/CommandBusService";

export class BackgroundController {
  constructor(app: Elysia, commandBus: CommandBusService) {
    app.use(new Elysia({ prefix: "/background" }));
  }
}
