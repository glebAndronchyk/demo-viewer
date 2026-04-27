import {
  connectDatabase,
  DatabaseConnection,
  DemoChunkModel,
  MatchModel,
  PlayerAccuracyModel,
  PlayerClutchesModel,
  PlayerEconomyModel,
  PlayerStatsModel,
  PlayerUtilityModel,
  PlayerWeaponsUsageModel,
  UserModel,
  WeaponStatsModel,
} from "@demo-viewer/database";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";
import * as mongoose from "mongoose";

export class DatabaseService {
  get UserModel() {
    return UserModel;
  }

  get MatchModel() {
    return MatchModel;
  }

  get DemoChunkModel() {
    return DemoChunkModel;
  }

  get PlayerStatsModel() {
    return PlayerStatsModel;
  }

  get PlayerClutchesModel() {
    return PlayerClutchesModel;
  }

  get PlayerEconomyModel() {
    return PlayerEconomyModel;
  }

  get PlayerAccuracyModel() {
    return PlayerAccuracyModel;
  }

  get PlayerUtilityModel() {
    return PlayerUtilityModel;
  }

  get PlayerWeaponsUsageModel() {
    return PlayerWeaponsUsageModel;
  }

  get WeaponStatsModel() {
    return WeaponStatsModel;
  }

  private constructor(private readonly connection: DatabaseConnection) {}

  static async connect(
    configuration: ConfigurationInboundPort,
  ): Promise<DatabaseService> {
    const connection = await connectDatabase({
      uri: configuration.databaseConnectionString,
    });

    return new this(connection);
  }

  async transaction<T extends () => Promise<any>>(
    cb: T,
  ): Promise<Awaited<ReturnType<T>>> {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();
      const result = await cb();
      await session.commitTransaction();
      return result;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      await session.endSession();
    }
  }
}
