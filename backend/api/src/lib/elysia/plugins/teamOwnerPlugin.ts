import { Elysia } from "elysia";
import { jwtPlugin } from "./jwtPlugin";
import { ForbiddenError, UnauthorizedError } from "../../errors/AppErrors";
import type { TeamOutboundPort } from "@demo-viewer/domain/src/ports/outbound/TeamOutboundPort";

export const teamOwnerPlugin = (secret: string, teamRepository: TeamOutboundPort) => {
  return new Elysia({ name: "team-owner-plugin" })
    .use(jwtPlugin(secret))
    .derive(
      { as: "scoped" },
      async ({ jwt, cookie: { auth }, params }) => {
        const data = await jwt.verify(auth.value as any);
        if (!data) throw new UnauthorizedError();

        const groupId = (params as Record<string, string>).groupId;
        if (!groupId) throw new ForbiddenError("Missing groupId");

        const group = await teamRepository.getTeamById(groupId);
        if (!group) throw new ForbiddenError("Team not found");
        if (group.ownerId !== data.sub) throw new ForbiddenError("Only the team owner can perform this action");

        return data;
      },
    );
};
