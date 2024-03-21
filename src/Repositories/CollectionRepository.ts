import collect, { Collection } from 'collect.js';
import { Fluent } from '../Models';
import {
  SearchCollection,
  Where,
  Order,
  Direction,
  Operator,
  Searchable,
  CollectionRecord,
} from '../Contracts';
import Repository from './Repository';
import { isRegExp } from 'util/types';

export default abstract class CollectionRepository extends Repository<Fluent> {
  /**
   * Resolve items from the store path.
   */
  protected resolveItems(): Array<CollectionRecord> {
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
    let collection = this.makeCollection().filter((item) => {
      return this.wheres.every((where) => this.checkAgainstWhere(item, where));
    });

    this.orders.forEach((order: Order) => {
      collection = collection[
        order.direction === Direction.ASC ? 'sortBy' : 'sortByDesc'
      ](order.key);
    });

    return this.modifiers.reduce((collection, modifier) => {
      const modified = modifier(collection);

      return modified instanceof Collection ? modified : collection;
    }, collection);
  }

  /**
   * Make collection from entire data.
   */
  protected makeCollection(): Collection<Fluent> {
    return new Collection<Fluent>(this.prepareItems(this.resolveItems()));
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
          // compare numbers
          if (Number(value) === item.getAttribute(where.key)) {
            return true;
          }
          // to handle soft deletes
          if (value === null) {
            return [value, undefined].includes(item.getAttribute(where.key));
          }
          // compare others
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
          item.getAttribute(where.key) ?? '',
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
        searchCallback.test(item.getAttribute(searchable) ?? '')
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
    this.resolveItems().push(
      model
        .setAttribute(model.getKeyName(), model.getKey() ?? this.newId())
        .all(),
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
    const keyName = model.getKeyName();
    const index = this.resolveItems().indexOf(
      (item: CollectionRecord) => item[keyName] === model.getKey(),
    );

    this.resolveItems()[index] = model.all();

    return model;
  }

  /**
   * Delete model for the given key.
   */
  async delete(key: string | number): Promise<void> {
    const keyName = this.model().getKeyName();
    const index = this.resolveItems().indexOf(
      (item: CollectionRecord) => item[keyName] === key,
    );

    this.resolveItems().splice(index, 1);
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
