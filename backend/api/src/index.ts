import { TeamRepository } from "./repository/TeamRepository";
import { AuthRepository } from "./repository/AuthRepository";
import { EnvConfiguration } from "./configuration/EnvConfiguration";
import { GameCoordinatorRepository } from "./repository/GameCoordinatorRepository";
import { ParserRepository } from "./repository/ParserRepository";
import { MatchRepository } from "./repository/MatchRepository";
import { NotificationRepository } from "./repository/NotificationRepository";
import { SteamFriendsRepository } from "./repository/SteamFriendsRepository";
import { SteamUserRepository } from "./repository/SteamUserRepository";
import { DIContainer } from "@demo-viewer/backend-shared/src/lib/di/DIContainer";
import { CommandBusService } from "./adapters/CommandBusService";
import { App } from "./app/App";
import {
  StatisticsController,
  AuthorizationController,
  BackgroundController,
  MaintenanceController,
  ParsingController,
  StreamingController,
  TeamController,
  StorageController,
} from "./controllers";
import {
  CollectMatchesFromUserCron,
  ProcessPendingNotificationsCron,
} from "./cron";
import { DatabaseService } from "./adapters/DatabaseService";
import { UserController } from "./controllers/UserController";
import { UserRepository } from "./repository/UserRepository";
import { SteamBotService } from "./adapters/SteamBotService";
import { ComputeResourcesQueueService } from "./adapters/ComputeResourcesQueueService";
import { LocalFilesystemStorageAdapter } from "./adapters/LocalFilesystemStorageAdapter";
import { CollectMatchAnalyticsCron } from "./cron/CollectMatchAnalyticsCron";
import { LayeredAnalyticsCalculator } from "./repository/LayeredAnalyticsCalculator";
import { MemoryCache } from "@demo-viewer/backend-shared";

const TypedApp = App.getTypedConstructor();

const config = new EnvConfiguration();
console.log(`Loaded config:${config.toJson()}`);

const db = await DatabaseService.connect(config);
const steamBot = await SteamBotService.create(config);

const di = new DIContainer()
  .addInstance(EnvConfiguration, config)
  .addSingleton(TypedApp as any, [EnvConfiguration])
  .addInstance(DatabaseService as never, db as never)
  .addInstance(SteamBotService, steamBot)
  .addSingleton(MemoryCache)
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
    NotificationRepository,
    SteamFriendsRepository,
    SteamUserRepository,
  ])
  // repositories/services/commands
  .addSingleton(TeamRepository)
  .addSingleton(AuthRepository, [EnvConfiguration])
  .addSingleton(GameCoordinatorRepository, [EnvConfiguration, SteamBotService])
  .addSingleton(ParserRepository, [EnvConfiguration])
  .addSingleton(UserRepository, [DatabaseService as never])
  .addSingleton(MatchRepository, [DatabaseService as never, MemoryCache])
  .addSingleton(ComputeResourcesQueueService, [EnvConfiguration])
  .addSingleton(LocalFilesystemStorageAdapter, [EnvConfiguration])
  .addSingleton(NotificationRepository, [DatabaseService as never])
  .addSingleton(SteamFriendsRepository, [EnvConfiguration])
  .addSingleton(SteamUserRepository, [EnvConfiguration, MemoryCache])
  // controllers
  .addSingleton(MaintenanceController, [
    TypedApp,
    CommandBusService,
    UserRepository,
  ])
  .addSingleton(StatisticsController, [TypedApp, CommandBusService])
  .addSingleton(AuthorizationController, [
    TypedApp,
    EnvConfiguration,
    CommandBusService,
    UserRepository,
  ])
  .addSingleton(BackgroundController, [TypedApp, CommandBusService])
  .addSingleton(ParsingController, [TypedApp, CommandBusService])
  .addSingleton(StreamingController, [TypedApp, CommandBusService, MemoryCache])
  .addSingleton(TeamController, [
    TypedApp,
    EnvConfiguration,
    TeamRepository,
    CommandBusService,
  ])
  .addSingleton(UserController, [TypedApp, EnvConfiguration, CommandBusService])
  .addSingleton(StorageController, [TypedApp, CommandBusService])
  // cron
  .addSingleton(CollectMatchesFromUserCron, [
    TypedApp,
    CommandBusService,
    EnvConfiguration,
  ])
  .addSingleton(LayeredAnalyticsCalculator, [
    MatchRepository,
    ComputeResourcesQueueService,
    EnvConfiguration,
  ])
  .addSingleton(CollectMatchAnalyticsCron, [
    TypedApp,
    CommandBusService,
    EnvConfiguration,
    LayeredAnalyticsCalculator,
  ])
  .addSingleton(ProcessPendingNotificationsCron, [TypedApp, CommandBusService]);

di.activate();
const cfg = di.getInstance(EnvConfiguration);
di.getInstance(TypedApp).listen(cfg.apiPort);

console.log(`Listened on: http://localhost:${cfg.apiPort}`);
console.log(`Api can be found here: http://localhost:${cfg.apiPort}/openapi`);
