import type { MatchOutboundPort } from "../../../ports/outbound/MatchOutboundPort.ts";

export abstract class AnalyticsCalculator<TReturn> {
  protected static cache<TReturn>() {
    return function (
      target: AnalyticsCalculator<TReturn>,
      key: string,
      descriptor: PropertyDescriptor,
    ) {
      const original = descriptor.value as Function;

      descriptor.value = async function (
        this: AnalyticsCalculator<TReturn>,
        ...args: any[]
      ) {
        if (this.operationCache.has(key)) {
          return this.operationCache.get(key);
        }

        const result = await original.apply(this, args);
        this.operationCache.set(key, result);
        return result;
      };
    };
  }

  protected readonly dbCache: Map<string, any> = new Map<string, any>();
  protected readonly operationCache: Map<string, TReturn> = new Map<
    string,
    TReturn
  >();

  constructor(
    protected readonly matchId: string,
    protected readonly playerSteamId: string,
    protected readonly matchOutbound: MatchOutboundPort,
  ) {}

  /**
   * Aggregator function to calculate all required metrics
   */
  abstract calculate(...args: any[]): TReturn | Promise<TReturn>;
}
