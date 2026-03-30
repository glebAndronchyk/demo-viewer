import type { GenericCommand } from "./GenericCommand.ts";
import type { GenericCommandHandler } from "./GenericCommandHandler.ts";

export type CommandsMap<
  TCommands extends Array<GenericCommand<any>>,
  TResult extends Record<TCommands[number]["type"], any>,
> = {
  [TCommand in TCommands[number] as TCommand["type"]]: GenericCommandHandler<
    TCommand,
    TResult[TCommand["type"]] | Promise<TResult[TCommand["type"]]>
  >;
};
