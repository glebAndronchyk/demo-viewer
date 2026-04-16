import { createHash } from "crypto";
import { type EventConstructor, MatchEvent } from "./MatchEvent.ts";

type EventClass<T extends MatchEvent> = Omit<EventConstructor<T>, "getFacetName">;

export abstract class AnalyticsQueryBuilder<T extends MatchEvent> {
  protected filterObject: Record<string, any> = {};
  protected tickFilter: Record<string, any> = {};

  constructor(private readonly eventClass: EventClass<T>) {}

  inTickRange(range: [number, number]) {
    this.tickFilter["gameTick"] = { $gte: range[0], $lte: range[1] };
    return this;
  }

  private computeFacetName(): string {
    const payload = JSON.stringify({
      t: this.eventClass.eventType,
      f: this.filterObject,
      tf: this.tickFilter,
    });
    const hash = createHash("sha256").update(payload).digest("hex").slice(0, 8);
    return `${this.eventClass.eventType}-${hash}`;
  }

  build(): EventConstructor<T> {
    return {
      eventType: this.eventClass.eventType,
      filterObject: this.filterObject,
      tickFilter: this.tickFilter,
      is: this.eventClass.is,
      fromRaw: this.eventClass.fromRaw,
      getFacetName: () => this.computeFacetName(),
    };
  }
}
