import { CommandBus } from "@demo-viewer/domain/src/lib/command_bus";
import domainOperations, {
  type DomainCommandsMap,
} from "@demo-viewer/domain/src/bindings/operations";
import { ParserRepository } from "../repository/ParserRepository";
import { GameCoordinatorRepository } from "../repository/GameCoordinatorRepository";
import { AuthRepository } from "../repository/AuthRepository";
import { TeamRepository } from "../repository/TeamRepository";
import { UserRepository } from "../repository/UserRepository";

export class CommandBusService extends CommandBus<DomainCommandsMap> {
  constructor(
    authRepository: AuthRepository,
    gameCoordinatorRepository: GameCoordinatorRepository,
    parserRepository: ParserRepository,
    teamRepository: TeamRepository,
    userRepository: UserRepository,
  ) {
    super(
      domainOperations({
        authRepository,
        gameCoordinatorRepository,
        parserRepository,
        teamRepository,
        userRepository,
      }),
    );
  }
}
