export interface QueueOutboundPort {
  enqueue(outbound: () => Promise<unknown>): Promise<void>;
}
