export interface ChunkMessage {
  type: "chunk";
}
export interface HeaderMessage {
  type: "header";
}
export interface SummaryMessage {
  type: "summary";
}

export type ParsingMessage = ChunkMessage | HeaderMessage | SummaryMessage;

export interface ParseArgs {
  framesInChunkCount: number;
  filePath: string;
  onHeaderMessageReceived: (m: HeaderMessage) => void;
  onChunkMessageReceived: (c: ChunkMessage) => void;
  onSummaryMessageReceived: (s: SummaryMessage) => void;
}

const parse = async (args: ParseArgs) => {
  const {
    framesInChunkCount,
    filePath,
    onChunkMessageReceived,
    onSummaryMessageReceived,
    onHeaderMessageReceived,
  } = args;

  const child = Bun.spawn([
    "./main",
    "-demo",
    "./match.dem",
    "-chunk-size",
    "1000",
  ]);

  for await (const chunk of child.stdout) {
    try {
      const obj = JSON.parse(new TextDecoder().decode(chunk)) as ParsingMessage;

      switch (obj.type) {
        case "header":
          onHeaderMessageReceived(obj);
          break;
        case "summary":
          onSummaryMessageReceived(obj);
          break;
        case "chunk":
          onChunkMessageReceived(obj as ChunkMessage);
          break;
        default:
          console.warn("Unsupported chunk type: ", obj);
      }
    } catch (e) {
      console.warn(`Failed to parse message from chunk: ${chunk}`);
    }
  }
};

export default parse;
