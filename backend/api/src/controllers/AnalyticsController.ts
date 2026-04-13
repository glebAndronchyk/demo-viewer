import { Elysia } from "elysia";
import { CommandBusService } from "../adapters/CommandBusService";

export class AnalyticsController {
  constructor(app: Elysia, commandBus: CommandBusService) {
    app.use(new Elysia({ prefix: "/analytics", tags: ["analytics"] }));
  }
}
