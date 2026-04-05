import { ParserOutbound } from "@demo-viewer/domain/src/ports/outbound/ParserOutbound";
import parse from "@demo-viewer/demo-composer";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";

export class ParserRepository implements ParserOutbound {
  constructor(private readonly configuration: ConfigurationInboundPort) {}

  parseDemoFromRemote(url: string): Promise<object> {
    throw new Error("Method not implemented.");
  }

  async parseDemoFromLocal(path: string): Promise<object> {
    await parse({ filePath: path, framesInChunkCount: 100 });
    return {};
  }
}
