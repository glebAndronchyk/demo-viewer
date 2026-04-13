import { Elysia } from "elysia";
import { jwtPlugin } from "./jwtPlugin";
import { ForbiddenError, UnauthorizedError } from "../../errors/AppErrors";
import type { TeamOutboundPort } from "@demo-viewer/domain/src/ports/outbound/TeamOutboundPort";

export const teamMemberPlugin = (secret: string, teamRepository: TeamOutboundPort) => {
  return new Elysia({ name: "team-member-plugin" })
    .use(jwtPlugin(secret))
    .derive(
      { as: "scoped" },
      async ({ jwt, cookie: { auth }, params }) => {
        const data = await jwt.verify(auth.value as any);
        if (!data) throw new UnauthorizedError();

        const groupId = (params as Record<string, string>).groupId;
        if (!groupId) throw new ForbiddenError("Missing groupId");

        const isMember = await teamRepository.isMember(groupId, data.sub);
        if (!isMember) throw new ForbiddenError("You are not a member of this team");

        return data;
      },
    );
};
