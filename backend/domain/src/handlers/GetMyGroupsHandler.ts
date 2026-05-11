import type { GenericCommandHandler } from "../lib/command_bus";
import { createRegistration } from "../lib/command_bus/HandlerRegistration.ts";
import type { DomainOutbound } from "../types/DomainOutbound.ts";
import type {
  GetMyGroupsCommand,
  GetMyGroupsCommandResult,
} from "../commands/GetMyGroupsCommand.ts";

export const getMyGroupsHandler = (outbound: DomainOutbound) => {
  const handler: GenericCommandHandler<
    GetMyGroupsCommand,
    GetMyGroupsCommandResult
  > = async (command) => {
    const [owned, joined] = await Promise.all([
      outbound.teamRepository.getTeamsByOwnerId(command.requesterId),
      outbound.teamRepository.getGroupsMemberOf(command.requesterId),
    ]);

    return {
      owned: owned.map((g) => ({ id: g.id, name: g.name, isOpen: g.isOpen, createdAt: g.createdAt })),
      joined: joined.map((g) => ({ id: g.id, name: g.name, ownerId: g.ownerId, isOpen: g.isOpen, createdAt: g.createdAt })),
    } satisfies GetMyGroupsCommandResult;
  };

  handler.match = (c: object): c is GetMyGroupsCommand => {
    return "type" in c && c.type === ("get_my_groups" satisfies GetMyGroupsCommand["type"]);
  };

  return handler;
};

export const getMyGroupsRegistration = createRegistration<GetMyGroupsCommand, GetMyGroupsCommandResult>(
  "get_my_groups",
  getMyGroupsHandler,
);

export default getMyGroupsRegistration;
