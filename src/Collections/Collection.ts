import { Collection as BaseCollection } from 'collect.js';
import { type AnyValue, UnknownRecord } from '../Contracts';

export default class Collection<TItem> extends BaseCollection<TItem> {
  /**
   * The get method returns the item at a given key. If the key does not exist, null is returned.
   */
  get<K, V>(
    path: keyof TItem | K,
    defaultValue?: ((...any: unknown[]) => V | TItem) | V | TItem,
  ): TItem | null {
    if (typeof path !== 'string' || !path.includes('.')) {
      return super.get(path, defaultValue);
    }

    const [key, ...paths] = path.split('.');

    if (!this.has(key)) {
      return this.get(key, defaultValue);
    }

    const value = this.get(key);

    if (paths.length === 0 || typeof value !== 'object' || value === null) {
      return value;
    }

    return new Collection<TItem | null>(value).get(
      paths.join('.'),
      defaultValue,
    );
  }

  /**
   * The has method determines if one or more keys exists in the collection.
   */
  has<K>(path: keyof TItem | K | Array<keyof TItem>): boolean {
    if (typeof path !== 'string' || !path.includes('.')) {
      return super.has(path);
    }

    const keys = path.split('.');
    let current: AnyValue = this.all();

    for (const key of keys) {
      if (current == null || !(key in current)) {
        return false;
      }
      current = current[key];
    }

    return current !== undefined;
  }
}
