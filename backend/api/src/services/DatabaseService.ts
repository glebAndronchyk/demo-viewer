import { connectDatabase, UserModel } from "@demo-viewer/database";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";

export class DatabaseService {
  get UserModel() {
    return UserModel;
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
