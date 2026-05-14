import type { MemoryCache } from "./MemoryCache.ts";

export class MemoryCacheAccessor<K extends string | number, V> {
  constructor(
    private readonly cache: MemoryCache,
    private readonly _namespace: string,
  ) {}

  get namespace() {
    return this._namespace;
  }

  private key(k: K): string {
    return `${this._namespace}:${k}`;
  }

  get(k: K): V | undefined {
    return this.cache.get<V>(this.key(k));
  }

  set(k: K, v: V): void {
    this.cache.set(this.key(k), v);
  }

  delete(k: K): void {
    this.cache.delete(this.key(k));
  }

  has(k: K): boolean {
    return this.cache.has(this.key(k));
  }
}
