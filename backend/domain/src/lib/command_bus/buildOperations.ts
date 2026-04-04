import type { GenericCommand } from "./GenericCommand.ts";
import type { GenericCommandHandler } from "./GenericCommandHandler.ts";
import type { HandlerRegistration } from "./HandlerRegistration.ts";
import type { DomainOutbound } from "../../types/DomainOutbound.ts";

type RegistrationCommand<T> = T extends HandlerRegistration<infer C, any> ? C : never;
type RegistrationResult<TRegs, TType extends string> =
  TRegs extends ReadonlyArray<infer R>
    ? R extends HandlerRegistration<GenericCommand<TType>, infer Res>
      ? Res
      : never
    : never;

export type RegistrationsToMap<TRegs extends ReadonlyArray<HandlerRegistration<any, any>>> = {
  [TReg in TRegs[number] as RegistrationCommand<TReg>["type"]]: GenericCommandHandler<
    RegistrationCommand<TReg>,
    RegistrationResult<TRegs, RegistrationCommand<TReg>["type"]>
  >;
};

export function buildOperations<const TRegs extends ReadonlyArray<HandlerRegistration<any, any>>>(
  registrations: TRegs,
  outbound: DomainOutbound,
): RegistrationsToMap<TRegs> {
  const map = {} as Record<string, GenericCommandHandler<any, any>>;
  for (const reg of registrations) {
    map[reg.commandType] = reg.factory(outbound);
  }
  return map as RegistrationsToMap<TRegs>;
}
