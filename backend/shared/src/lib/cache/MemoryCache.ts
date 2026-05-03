export class MemoryCache {
  private readonly store = new Map<string, unknown>();

  get<V>(key: string): V | undefined {
    return this.store.get(key) as V | undefined;
  }

  set<V>(key: string, value: V): void {
    this.store.set(key, value);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  has(key: string): boolean {
    return this.store.has(key);
  }
}
