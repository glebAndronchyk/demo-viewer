import type { TeamOutboundPort } from "../ports/outbound/TeamOutboundPort.ts";
import type { AuthOutboundPort } from "../ports/outbound/AuthOutboundPort.ts";

export interface DomainOutbound {
  teamRepository: TeamOutboundPort;
  authRepository: AuthOutboundPort;
}
