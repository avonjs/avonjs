import collect, { Collection } from 'collect.js';
import { Fluent } from '../Models';
import {
  SearchCollection,
  Where,
  Order,
  Direction,
  Operator,
  Searchable,
} from '../contracts';
import Repository from './Repository';
import { isRegExp } from 'util/types';

export default abstract class CollectionRepository extends Repository<Fluent> {
  /**
   * Collection of the items.
   */
  protected collection: Collection<Fluent>;

  /**
   * Initiate repository instance.
   */
  constructor(items: any[] = []) {
    super();
    this.collection = new Collection<Fluent>(
      this.prepareItems(items.concat(this.resolveItems())),
    );
  }

  /**
   * Resolve items from the store path.
   */
  protected resolveItems(): Record<string | number, any> {
    return [];
  }

  /**
   * Prepare given items for collection.
   */
  protected prepareItems(items: any[]): Fluent[] {
    return items.map((item) => {
      return item instanceof Fluent ? item : new Fluent(item);
    });
  }

  /**
   * Search storage for given query string.
   */
  async search(
    search: string,
    page: number = 1,
    perPage: number = 15,
  ): Promise<SearchCollection<Fluent>> {
    const searched = this.searchCollection(search);

    return {
      count: searched.count(),
      items: searched.slice(perPage * (page - 1), perPage).toArray(),
    };
  }

  /**
   * Find all model's for the given conditions.
   */
  async all(wheres: Where[] = []): Promise<Fluent[]> {
    return this.where(wheres).getCollection().toArray();
  }

  /**
   * Search collection for given query string.
   */
  protected searchCollection(search: string = ''): Collection<Fluent> {
    const collection = this.getCollection();

    return search.length > 0
      ? collection.filter((item: Fluent) => this.performSearch(item, search))
      : collection;
  }

  /**
   * Get the collection with applied constraints.
   */
  protected getCollection(): Collection<Fluent> {
    let collection = new Collection<Fluent>(this.collection).filter((item) => {
      return this.wheres.every((where) => this.checkAgainstWhere(item, where));
    });

    this.orders.forEach((order: Order) => {
      collection = collection[
        order.direction === Direction.ASC ? 'sortBy' : 'sortByDesc'
      ](order.key);
    });

    return collection;
  }

  /**
   * Apply the where constraint on the collection item.
   */
  protected checkAgainstWhere(item: Fluent, where: Where): boolean {
    switch (where.operator) {
      case Operator.in:
      case Operator.eq:
        const values = Array.isArray(where.value) ? where.value : [where.value];

        return collect(values).contains((value: any) => {
          if (Number(value) === item.getAttribute(where.key)) {
            return true;
          }

          return item.getAttribute(where.key) === value;
        });
      case Operator.lte:
        return item.getAttribute(where.key) <= where.value;
      case Operator.gte:
        return item.getAttribute(where.key) >= where.value;
      case Operator.not:
      case Operator.notIn:
        return !this.checkAgainstWhere(item, {
          ...where,
          operator: Operator.in,
        });
      case Operator.lt:
        return item.getAttribute(where.key) < where.value;
      case Operator.gt:
        return item.getAttribute(where.key) > where.value;
      case Operator.like:
        return new RegExp(where.value.replace(/%/g, '.*')).test(
          item.getAttribute(where.key),
        );
      default:
        return true;
    }
  }

  /**
   * Perform searches on the given item.
   */
  protected performSearch(item: Fluent, search: string): boolean {
    for (const searchable in this.searchableColumns()) {
      const searchCallback = this.searchableColumns()[searchable];

      if (
        isRegExp(searchCallback) &&
        searchCallback.test(item.getAttribute(searchable))
      ) {
        return true;
      }
      if (
        typeof searchCallback === 'function' &&
        searchCallback(search, item)
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Store given model into the storage.
   */
  async store(model: Fluent): Promise<Fluent> {
    this.collection = this.collection.push(
      model.setAttribute(model.getKeyName(), model.getKey() ?? this.newId()),
    );

    return model;
  }

  /**
   * Find first model for the given conditions.
   */
  async first(wheres: Where[] = []): Promise<Fluent> {
    this.where(wheres);

    return this.getCollection().first();
  }

  /**
   * Store given model into the storage.
   */
  async update(model: Fluent): Promise<Fluent> {
    this.collection = this.collection.map((item) => {
      return String(item.getKey()) === String(model.getKey()) ? model : item;
    });

    return model;
  }

  /**
   * Delete model for the given key.
   */
  async delete(key: string | number): Promise<void> {
    this.collection = this.getCollection().filter(
      (model) => String(model.getKey()) !== String(key),
    );
  }

  /**
   * Create new instance of model.
   */
  model(): Fluent {
    return new Fluent();
  }

  /**
   * Generate new id for storing item.
   */
  public newId(): string | number {
    return Date.now();
  }

  /**
   * Get key name of the item.
   */
  abstract searchableColumns(): Searchable[];
}
