export abstract class MatchEvent {
  static readonly filterObject: Record<string, unknown> | undefined = undefined;
  abstract readonly type: string;
}

export type EventConstructor<T extends MatchEvent> = {
  readonly eventType: string;
  readonly filterObject?: Record<string, unknown>;
  is(event: unknown): event is T;
  fromRaw(raw: { type: string; data: Record<string, unknown> }): T;
};

export type EventsFromConstructors<
  T extends readonly EventConstructor<MatchEvent>[],
> = {
  [K in keyof T]: T[K] extends EventConstructor<infer E> ? E[] : never;
};
