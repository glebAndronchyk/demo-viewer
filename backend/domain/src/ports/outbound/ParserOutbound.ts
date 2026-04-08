export interface ParserOutbound {
  parseDemoFromRemote(url: string): { pid: number; promise: Promise<number> };
  parseDemoFromLocal(path: string): { pid: number; promise: Promise<number> };
}
