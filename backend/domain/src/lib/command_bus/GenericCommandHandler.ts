import type { GenericCommand } from "./GenericCommand.ts";

export type GenericCommandHandler<
  TCommand extends GenericCommand<any>,
  TReturn,
> = ((command: TCommand) => TReturn | Promise<TReturn>) & {
  match: (command: object) => command is TCommand;
};
