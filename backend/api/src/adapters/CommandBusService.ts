import { CommandBus } from "@demo-viewer/domain/src/lib/command_bus";
import domainOperations, {
  type DomainCommandsMap,
} from "@demo-viewer/domain/src/bindings/operations";
import { ParserRepository } from "../repository/ParserRepository";
import { GameCoordinatorRepository } from "../repository/GameCoordinatorRepository";
import { AuthRepository } from "../repository/AuthRepository";
import { TeamRepository } from "../repository/TeamRepository";
import { UserRepository } from "../repository/UserRepository";
import { MatchRepository } from "../repository/MatchRepository";
import { NotificationRepository } from "../repository/NotificationRepository";
import { SteamFriendsRepository } from "../repository/SteamFriendsRepository";
import { SteamUserRepository } from "../repository/SteamUserRepository";
import { EnvConfiguration } from "../configuration/EnvConfiguration";
import { ComputeResourcesQueueService } from "./ComputeResourcesQueueService";
import { LocalFilesystemStorageAdapter } from "./LocalFilesystemStorageAdapter";

export class CommandBusService extends CommandBus<DomainCommandsMap> {
  constructor(
    authRepository: AuthRepository,
    gameCoordinatorRepository: GameCoordinatorRepository,
    parserRepository: ParserRepository,
    teamRepository: TeamRepository,
    userRepository: UserRepository,
    matchRepository: MatchRepository,
    configuration: EnvConfiguration,
    queue: ComputeResourcesQueueService,
    fileStorage: LocalFilesystemStorageAdapter,
    notificationRepository: NotificationRepository,
    steamFriendsRepository: SteamFriendsRepository,
    steamUserRepository: SteamUserRepository,
  ) {
    super(
      domainOperations({
        authRepository,
        gameCoordinatorRepository,
        parserRepository,
        teamRepository,
        userRepository,
        matchRepository,
        configuration,
        queue,
        fileStorage,
        notificationRepository,
        steamFriendsRepository,
        steamUserRepository,
      }),
    );
  }
}
