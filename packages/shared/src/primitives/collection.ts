/**
 * Shared Collection primitive.
 */

export class Collection<T> implements Iterable<T> {
  private readonly items: readonly T[];

  constructor(items: readonly T[] = []) {
    this.items = [...items];
  }

  static empty<T>(): Collection<T> {
    return new Collection<T>();
  }

  add(item: T): Collection<T> {
    return new Collection([...this.items, item]);
  }

  remove(predicate: (item: T) => boolean): Collection<T> {
    return new Collection(
      this.items.filter(item => !predicate(item)),
    );
  }

  map<U>(mapper: (item: T) => U): Collection<U> {
    return new Collection(
      this.items.map(mapper),
    );
  }

  filter(predicate: (item: T) => boolean): Collection<T> {
    return new Collection(
      this.items.filter(predicate),
    );
  }

  toArray(): readonly T[] {
    return [...this.items];
  }

  get size(): number {
    return this.items.length;
  }

  [Symbol.iterator](): Iterator<T> {
    return this.items[Symbol.iterator]();
  }
}
