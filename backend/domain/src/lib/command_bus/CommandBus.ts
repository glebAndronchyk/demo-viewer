import type { GenericCommand } from "./GenericCommand.ts";
import type { GenericCommandHandler } from "./GenericCommandHandler.ts";

type AnyCommandsMap = Record<string, GenericCommandHandler<any, any>>;

type HandlerResult<THandler> = THandler extends GenericCommandHandler<any, infer R> ? R : never;

export class CommandBus<TMap extends AnyCommandsMap> {
  constructor(private readonly map: TMap) {}

  dispatch<T extends GenericCommand<keyof TMap & string>>(command: T): HandlerResult<TMap[T["type"]]> {
    const handler = this.map[command.type as keyof TMap];
    if (handler && handler.match(command)) {
      return handler(command) as HandlerResult<TMap[T["type"]]>;
    }

    throw new Error(`Unhandled command ${command.type}`);
  }
}
