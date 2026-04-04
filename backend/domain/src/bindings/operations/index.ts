import * as registrations from "../../handlers/index.ts";
import { buildOperations, type RegistrationsToMap } from "../../lib/command_bus/buildOperations.ts";
import type { DomainOutbound } from "../../types/DomainOutbound.ts";

const allRegistrations = [
  registrations.createTeamRegistration,
  registrations.addUserToTeamRegistration,
  registrations.registerOrLoginWithSteamRegistration,
  registrations.linkMatchesToUserRegistration,
  registrations.downloadAndParseDemoRegistration,
] as const;

export type DomainCommandsMap = RegistrationsToMap<typeof allRegistrations>;

const domainOperationsConstructor = (outbound: DomainOutbound): DomainCommandsMap =>
  buildOperations(allRegistrations, outbound);

export default domainOperationsConstructor;