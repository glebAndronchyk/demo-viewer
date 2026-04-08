export interface MatchOutboundPort {
  findByShareCode(shareCode: string): Promise<{ id: string } | null>;
}
