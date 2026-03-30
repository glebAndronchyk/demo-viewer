import type { TeamOutboundPort } from "../ports/outbound/TeamOutboundPort.ts";

export interface DomainOutbound {
  teamRepository: TeamOutboundPort;
}
