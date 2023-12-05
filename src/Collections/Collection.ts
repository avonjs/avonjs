import { Collection as BaseCollection } from 'collect.js';

export default class Collection<TItem> extends BaseCollection<TItem> {
  /**
   * The get method returns the item at a given key. If the key does not exist, null is returned.
   */
  get<K, V>(
    path: keyof TItem | K,
    defaultValue?: ((...any: any[]) => V | TItem) | V | TItem,
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

    return new Collection<any>(value).get(paths.join('.'), defaultValue);
  }

  /**
   * The has method determines if one or more keys exists in the collection.
   */
  has<K>(path: keyof TItem | K | Array<keyof TItem>): boolean {
    if (typeof path !== 'string' || !path.includes('.')) {
      return super.has(path);
    }

    return this.get(path, undefined) !== undefined;
  }
}
