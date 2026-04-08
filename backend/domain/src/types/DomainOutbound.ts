import type { TeamOutboundPort } from "../ports/outbound/TeamOutboundPort.ts";
import type { AuthOutboundPort } from "../ports/outbound/AuthOutboundPort.ts";
import type { GameCoordinatorOutboundPort } from "../ports/outbound/GameCoordinatorOutboundPort.ts";
import type { ParserOutbound } from "../ports/outbound/ParserOutbound.ts";
import type { UserOutboundPort } from "../ports/outbound/UserOutboundPort.ts";
import type { ConfigurationInboundPort } from "../ports/inbound/ConfigurationInboundPort.ts";
import type { QueueOutboundPort } from "../ports/outbound/QueueOutboundPort.ts";

export interface DomainOutbound {
  teamRepository: TeamOutboundPort;
  authRepository: AuthOutboundPort;
  gameCoordinatorRepository: GameCoordinatorOutboundPort;
  parserRepository: ParserOutbound;
  userRepository: UserOutboundPort;
  configuration: ConfigurationInboundPort;
  queue: QueueOutboundPort;
}
