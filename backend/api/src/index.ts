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
import { UserRepository } from "./repository/UserRepository";
import { SteamBotService } from "./services/SteamBotService";

const TypedApp = App.getTypedConstructor();

const config = new EnvConfiguration();
console.log(`Loaded config:${config.toJson()}`);

const db = await DatabaseService.connect(config);
const steamBot = await SteamBotService.create(config);

const di = new DIContainer()
  .addSingleton(TypedApp)
  .addInstance(EnvConfiguration, config)
  .addInstance(DatabaseService, db)
  .addInstance(SteamBotService, steamBot)
  .addSingleton(CommandBusService, [
    AuthRepository,
    GameCoordinatorRepository,
    ParserRepository,
    TeamRepository,
    UserRepository,
  ])
  // repositories/services/commands
  .addSingleton(TeamRepository)
  .addSingleton(AuthRepository, [EnvConfiguration])
  .addSingleton(GameCoordinatorRepository, [EnvConfiguration, SteamBotService])
  .addSingleton(ParserRepository, [EnvConfiguration])
  .addSingleton(UserRepository, [DatabaseService])
  // controllers
  .addSingleton(MaintenanceController, [
    TypedApp,
    CommandBusService,
    UserRepository,
  ])
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
  .addSingleton(UserController, [TypedApp, EnvConfiguration, CommandBusService])
  // cron
  .addSingleton(CollectMatchesFromUserCron, [TypedApp, CommandBusService]);

di.activate();
const cfg = di.getInstance(EnvConfiguration);
di.getInstance(TypedApp).listen(cfg.apiPort);

console.log(`Listened on: http://localhost:${cfg.apiPort}`);
console.log(`Api can be found here: http://localhost:${cfg.apiPort}/openapi`);
