import { TeamRepository } from "./repository/TeamRepository";
import { AuthRepository } from "./repository/AuthRepository";
import { EnvConfiguration } from "./configuration/EnvConfiguration";
import { GameCoordinatorRepository } from "./repository/GameCoordinatorRepository";
import { ParserRepository } from "./repository/ParserRepository";
import { MatchRepository } from "./repository/MatchRepository";
import { DIContainer } from "@demo-viewer/backend-shared/src/lib/di/DIContainer";
import { CommandBusService } from "./adapters/CommandBusService";
import { App } from "./app/App";
import {
  AnalyticsController,
  AuthorizationController,
  BackgroundController,
  MaintenanceController,
  ParsingController,
  StreamingController,
  TeamController,
  StorageController,
} from "./controllers";
import { CollectMatchesFromUserCron } from "./cron";
import { DatabaseService } from "./adapters/DatabaseService";
import { UserController } from "./controllers/UserController";
import { UserRepository } from "./repository/UserRepository";
import { SteamBotService } from "./adapters/SteamBotService";
import { ComputeResourcesQueueService } from "./adapters/ComputeResourcesQueueService";
import { LocalFilesystemStorageAdapter } from "./adapters/LocalFilesystemStorageAdapter";

const TypedApp = App.getTypedConstructor();

const config = new EnvConfiguration();
console.log(`Loaded config:${config.toJson()}`);

const db = await DatabaseService.connect(config);
const steamBot = await SteamBotService.create(config);

const di = new DIContainer()
  .addInstance(EnvConfiguration, config)
  .addSingleton(TypedApp as any, [EnvConfiguration])
  .addInstance(DatabaseService, db)
  .addInstance(SteamBotService, steamBot)
  .addSingleton(CommandBusService, [
    AuthRepository,
    GameCoordinatorRepository,
    ParserRepository,
    TeamRepository,
    UserRepository,
    MatchRepository,
    EnvConfiguration,
    ComputeResourcesQueueService,
    LocalFilesystemStorageAdapter,
  ])
  // repositories/services/commands
  .addSingleton(TeamRepository)
  .addSingleton(AuthRepository, [EnvConfiguration])
  .addSingleton(GameCoordinatorRepository, [EnvConfiguration, SteamBotService])
  .addSingleton(ParserRepository, [EnvConfiguration])
  .addSingleton(UserRepository, [DatabaseService])
  .addSingleton(MatchRepository, [DatabaseService])
  .addSingleton(ComputeResourcesQueueService, [EnvConfiguration])
  .addSingleton(LocalFilesystemStorageAdapter, [EnvConfiguration])
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
  .addSingleton(StorageController, [TypedApp, CommandBusService])
  // cron
  .addSingleton(CollectMatchesFromUserCron, [
    TypedApp,
    CommandBusService,
    EnvConfiguration,
  ]);

di.activate();
const cfg = di.getInstance(EnvConfiguration);
di.getInstance(TypedApp).listen(cfg.apiPort);

console.log(`Listened on: http://localhost:${cfg.apiPort}`);
console.log(`Api can be found here: http://localhost:${cfg.apiPort}/openapi`);
