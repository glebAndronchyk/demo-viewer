import { ParserOutbound } from "@demo-viewer/domain/src/ports/outbound/ParserOutbound";
import parse from "@demo-viewer/demo-composer";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";

export class ParserRepository implements ParserOutbound {
  constructor(private readonly configuration: ConfigurationInboundPort) {}

  async parseDemoFromRemote(url: string): Promise<object> {
    await parse({ fileUrl: url, framesInChunkCount: 100 });
    return {};
  }

  async parseDemoFromLocal(path: string): Promise<object> {
    await parse({ filePath: path, framesInChunkCount: 100 });
    return {};
  }
}
