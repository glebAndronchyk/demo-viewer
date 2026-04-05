import { TeamRepository } from "./repository/TeamRepository";
import { AuthRepository } from "./repository/AuthRepository";
import { EnvConfiguration } from "./configuration/EnvConfiguration";
import { GameCoordinatorRepository } from "./repository/GameCoordinatorRepository";
import { ParserRepository } from "./repository/ParserRepository";
import { DIContainer } from "@demo-viewer/backend-shared/src/lib/di/DIContainer";
import { CommandBusService } from "./services/CommandBusService";
import { App } from "./app/App";
import {
  AnalyticsController,
  AuthorizationController,
  BackgroundController,
  MaintenanceController,
  ParsingController,
  StreamingController,
  TeamController,
} from "./controllers";
import { CollectMatchesFromUserCron } from "./cron";
import { DatabaseService } from "./services/DatabaseService";
import { UserController } from "./controllers/UserController";

const TypedApp = App.getTypedConstructor();

const config = new EnvConfiguration();
console.log(`Loaded config:${config.toJson()}`);

const db = await DatabaseService.connect(config);

const di = new DIContainer()
  .addSingleton(TypedApp)
  .addInstance(EnvConfiguration, config)
  .addInstance(DatabaseService as any, db)
  // repositories/services/commands
  .addSingleton(TeamRepository)
  .addSingleton(AuthRepository, [EnvConfiguration])
  .addSingleton(GameCoordinatorRepository, [EnvConfiguration])
  .addSingleton(ParserRepository, [EnvConfiguration])
  .addSingleton(CommandBusService, [
    AuthRepository,
    GameCoordinatorRepository,
    ParserRepository,
    TeamRepository,
  ])
  // controllers
  .addSingleton(MaintenanceController, [TypedApp, CommandBusService])
  .addSingleton(AnalyticsController, [TypedApp, CommandBusService])
  .addSingleton(AuthorizationController, [
    TypedApp,
    EnvConfiguration,
    CommandBusService,
  ])
  .addSingleton(BackgroundController, [TypedApp, CommandBusService])
  .addSingleton(ParsingController, [TypedApp, CommandBusService])
  .addSingleton(StreamingController, [TypedApp, CommandBusService])
  .addSingleton(TeamController, [TypedApp, CommandBusService])
  .addSingleton(UserController, [TypedApp, EnvConfiguration])
  // cron
  .addSingleton(CollectMatchesFromUserCron, [TypedApp, CommandBusService]);

di.activate();
const cfg = di.getInstance(EnvConfiguration);
di.getInstance(TypedApp).listen(cfg.apiPort);

console.log(`Listened on: http://localhost:${cfg.apiPort}`);
console.log(`Api can be found here: http://localhost:${cfg.apiPort}/openapi`);
