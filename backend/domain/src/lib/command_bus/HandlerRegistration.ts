import type { GenericCommand } from "./GenericCommand.ts";
import type { GenericCommandHandler } from "./GenericCommandHandler.ts";
import type { DomainOutbound } from "../../types/DomainOutbound.ts";

export type HandlerRegistration<TCommand extends GenericCommand<any>, TResult> = {
  readonly commandType: TCommand["type"];
  readonly factory: (outbound: DomainOutbound) => GenericCommandHandler<TCommand, TResult>;
};

export function createRegistration<TCommand extends GenericCommand<any>, TResult>(
  commandType: TCommand["type"],
  factory: (outbound: DomainOutbound) => GenericCommandHandler<TCommand, TResult>,
): HandlerRegistration<TCommand, TResult> {
  return { commandType, factory };
}
