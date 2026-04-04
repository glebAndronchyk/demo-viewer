export interface ParserOutbound {
  parseDemoFromRemote(url: string): Promise<object>;
  parseDemoFromLocal(path: string): Promise<object>;
}
