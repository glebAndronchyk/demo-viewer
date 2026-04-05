import { Elysia } from "elysia";
import { buildSteamLoginUrl, verifySteamOpenId } from "../lib/steamOpenId";
import { CommandBusService } from "../services/CommandBusService";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";
import { RegisterOrLoginWithSteamCommand } from "@demo-viewer/domain/src/commands";
import { jwtPlugin } from "../lib/elysia/plugins/jwtPlugin";

export class AuthorizationController {
  constructor(
    app: Elysia,
    config: ConfigurationInboundPort,
    commandBus: CommandBusService,
  ) {
    app.use(
      new Elysia({ prefix: "/auth" })
        .use(jwtPlugin(config.jwtSecret))
        .get("/steam", ({ redirect }) => {
          const callbackUrl = `${config.apiBaseUrl}/auth/steam/callback`;
          return redirect(buildSteamLoginUrl(callbackUrl));
        })
        .get(
          "/steam/callback",
          async ({ jwt, query, redirect, set, cookie: { auth } }) => {
            const steamId = await verifySteamOpenId(
              query as Record<string, string>,
            );
            if (!steamId) {
              set.status = 401;
              return "Steam OpenID verification failed";
            }

            const result =
              await commandBus.dispatch<RegisterOrLoginWithSteamCommand>({
                type: "register_or_login_with_steam",
                steamId,
              });

            Promise.resolve(
              commandBus.dispatch({
                type: "link_matches_to_user",
                steamId,
                userId: result.userId,
              }),
            ).catch(console.error);

            auth.set({
              value: await jwt.sign({
                ...result,
                sub: result.userId,
              } as any),
              httpOnly: true,
              maxAge: 86400,
              sameSite: "none",
              secure: true,
            });

            return redirect(config.frontendUrl);
          },
        )
        .get("/me", async ({ jwt, status, cookie: { auth } }) => {
          const data = await jwt.verify(auth.value as any);

          if (!data) {
            return status(401, "Unauthorized");
          }

          return data;
        }),
    );
  }
}
