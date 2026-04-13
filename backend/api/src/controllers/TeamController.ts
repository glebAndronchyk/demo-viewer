import { Elysia, t } from "elysia";
import { CommandBusService } from "../adapters/CommandBusService";
import { EnvConfiguration } from "../configuration/EnvConfiguration";
import { TeamRepository } from "../repository/TeamRepository";
import { jwtPlugin } from "../lib/elysia/plugins/jwtPlugin";
import { teamMemberPlugin } from "../lib/elysia/plugins/teamMemberPlugin";
import { teamOwnerPlugin } from "../lib/elysia/plugins/teamOwnerPlugin";
import { UnauthorizedError } from "../lib/errors/AppErrors";

export class TeamController {
  constructor(
    app: Elysia,
    config: EnvConfiguration,
    teamRepository: TeamRepository,
    commandBus: CommandBusService,
  ) {
    const secret = config.jwtSecret;

    app.use(
      new Elysia({ prefix: "/team", tags: ["team"] })
        .use(jwtPlugin(secret))
        // POST /team — create a team (any authenticated user)
        .post(
          "/",
          async ({ jwt, cookie: { auth }, body }) => {
            const data = await jwt.verify(auth.value as any);
            if (!data) throw new UnauthorizedError();

            const result = await commandBus.dispatch({
              type: "create_team",
              name: body.name,
              ownerId: data.sub,
            });
            return { data: result, error: null, isSuccess: true };
          },
          { body: t.Object({ name: t.String() }) },
        )
        // Member-gated routes: GET /team/member/:groupId and /team/member/:groupId/users
        .use(
          new Elysia({ prefix: "/member" })
            .use(teamMemberPlugin(secret, teamRepository))
            .get(
              "/:groupId",
              async ({ params: { groupId }, sub }) => {
                const result = await commandBus.dispatch({
                  type: "get_team",
                  groupId,
                  requesterId: sub,
                });
                return { data: result, error: null, isSuccess: true };
              },
            )
            .get(
              "/:groupId/users",
              async ({ params: { groupId }, sub }) => {
                const result = await commandBus.dispatch({
                  type: "get_team_members",
                  groupId,
                  requesterId: sub,
                });
                return { data: result, error: null, isSuccess: true };
              },
            ),
        )
        // Owner-gated routes: /team/owner/:groupId/*
        .use(
          new Elysia({ prefix: "/owner" })
            .use(teamOwnerPlugin(secret, teamRepository))
            // POST /team/owner/:groupId/invite
            .post(
              "/:groupId/invite",
              async ({ params: { groupId }, body, sub }) => {
                const result = await commandBus.dispatch({
                  type: "add_user_to_team",
                  groupId,
                  steamId: body.steamId,
                  requesterId: sub,
                });
                return { data: result, error: null, isSuccess: true };
              },
              { body: t.Object({ steamId: t.String() }) },
            )
            // DELETE /team/owner/:groupId/users/:userId
            .delete(
              "/:groupId/users/:userId",
              async ({ params: { groupId, userId }, sub }) => {
                const result = await commandBus.dispatch({
                  type: "remove_user_from_team",
                  groupId,
                  userId,
                  requesterId: sub,
                });
                return { data: result, error: null, isSuccess: true };
              },
            )
            // PATCH /team/owner/:groupId
            .patch(
              "/:groupId",
              async ({ params: { groupId }, body, sub }) => {
                const result = await commandBus.dispatch({
                  type: "update_team",
                  groupId,
                  requesterId: sub,
                  name: body.name,
                  isOpen: body.isOpen,
                });
                return { data: result, error: null, isSuccess: true };
              },
              {
                body: t.Object({
                  name: t.Optional(t.String()),
                  isOpen: t.Optional(t.Boolean()),
                }),
              },
            ),
        ),
    );
  }
}
