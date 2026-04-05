import { Elysia } from "elysia";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";
import { userPlugin } from "../lib/elysia/plugins/userPlugin";

export class UserController {
  constructor(app: Elysia, configuration: ConfigurationInboundPort) {
    app.use(
      new Elysia({ prefix: "user/:id" })
        .use(userPlugin(configuration.jwtSecret))
        .get("/next-available-share-code", ({ params: { id } }) => {
          console.log(id);
        }),
    );
  }
}
