import {
  connectDatabase,
  DemoChunkModel,
  MatchModel,
  UserModel,
} from "@demo-viewer/database";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";

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

  static async connect(
    configuration: ConfigurationInboundPort,
  ): Promise<DatabaseService> {
    await connectDatabase({
      uri: configuration.databaseConnectionString,
    });

    return new this();
  }
}
