import * as registrations from "../../handlers/index.ts";
import {
  buildOperations,
  type RegistrationsToMap,
} from "../../lib/command_bus/buildOperations.ts";
import type { DomainOutbound } from "../../types/DomainOutbound.ts";

type Registrations = typeof registrations;
type AllRegistrations = ReadonlyArray<Registrations[keyof Registrations]>;

const allRegistrations = Object.values(
  registrations,
) as unknown as AllRegistrations;

export type DomainCommandsMap = RegistrationsToMap<AllRegistrations>;

const domainOperationsConstructor = (
  outbound: DomainOutbound,
): DomainCommandsMap => buildOperations(allRegistrations, outbound);

export default domainOperationsConstructor;
