import {
  connectDatabase,
  type DatabaseConnection,
} from "@demo-viewer/database";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";

export class DatabaseService {
  protected constructor(connection: DatabaseConnection) {
    return connection;
  }

  static async connect(
    configuration: ConfigurationInboundPort,
  ): Promise<DatabaseService> {
    const connection = await connectDatabase({
      uri: configuration.databaseConnectionString,
    });

    return new this(connection);
  }
}
