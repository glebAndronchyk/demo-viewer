import { ParserOutbound } from "@demo-viewer/domain/src/ports/outbound/ParserOutbound";
import parse from "@demo-viewer/demo-composer";
import { ConfigurationInboundPort } from "@demo-viewer/domain/src/ports/inbound/ConfigurationInboundPort";

export class ParserRepository implements ParserOutbound {
  constructor(private readonly configuration: ConfigurationInboundPort) {}

  parseDemoFromRemote(url: string, shareCode?: string) {
    return parse({ fileUrl: url, framesInChunkCount: 100, shareCode });
  }

  parseDemoFromLocal(path: string) {
    return parse({ filePath: path, framesInChunkCount: 100 });
  }
}
