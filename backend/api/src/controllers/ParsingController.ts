import { Elysia } from "elysia";
import { CommandBusService } from "../adapters/CommandBusService";

export class ParsingController {
  constructor(app: Elysia, commandBus: CommandBusService) {
    app.use(new Elysia({ prefix: "/parsing", tags: ["parsing"] }));
  }
}
