import type { MatchOutboundPort } from "../../../ports/outbound/MatchOutboundPort.ts";

export abstract class AnalyticsCalculator<TReturn> {
  protected static cache<TReturn>() {
    return function (target: AnalyticsCalculator<TReturn>, key: string) {
      if (typeof target[key as never] !== "function") {
        throw new Error("Tried to invoke .cache for non method type.");
      }

      const original = target[key as never] as Function;

      (target[key as never] as any) = async function (
        this: AnalyticsCalculator<TReturn>,
        ...args: any[]
      ) {
        if (this.cache.has(key)) {
          return this.cache.get(key);
        }

        const result = await original.apply(this, args);
        this.cache.set(key, result);
        return result;
      };
    };
  }

  protected readonly cache: Map<string, TReturn> = new Map<string, TReturn>();

  protected constructor(protected readonly matchOutbound: MatchOutboundPort) {}

  /**
   * Aggregator function to calculate all required metrics
   */
  abstract calculate(...args: any[]): TReturn | Promise<TReturn>;
}
