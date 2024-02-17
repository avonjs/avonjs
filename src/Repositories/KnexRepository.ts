import { Knex } from 'knex';
import { plural, singular } from 'pluralize';
import { Fluent } from '../Models';
import {
  Model,
  SearchCollection,
  Where,
  Direction,
  Operator,
} from '../Contracts';
import { slugify } from '../helpers';
import Repository from './Repository';

export default abstract class KnexRepository extends Repository<Model> {
  /**
   * Run transaction on the storage.
   */
  public async transaction<T>(callback: () => Promise<T>): Promise<T> {
    return this.connection().transaction(callback);
  }

  /**
   * Search storage for given query string.
   */
  async search(
    search: string,
    page: number = 1,
    perPage: number = 15,
  ): Promise<SearchCollection<Fluent>> {
    const query = this.performSearch(this.makeQuery(), search);
    const offset = (page - 1) * perPage > 0 ? (page - 1) * perPage : 0;
    const count = await query
      .clone()
      .debug(true)
      .count(`${this.model().getKeyName()} as count`)
      .first();

    const data = await query.limit(perPage).offset(offset).select('*');

    return {
      ...count,
      items: data.map((client: any) => new Fluent(client)),
    };
  }

  /**
   * Perform searches on the given item.
   */
  protected performSearch(
    query: Knex.QueryBuilder,
    search: string,
  ): Knex.QueryBuilder {
    return query;
  }

  /**
   * Find all model's for the given conditions.
   */
  async all(wheres: Where[] = []): Promise<Fluent[]> {
    const data = await this.where(wheres).makeQuery().select('*');

    return data.map((item: any) => new Fluent(item));
  }

  /**
   * Store given model into the storage.
   */
  async store(model: Fluent): Promise<Fluent> {
    const insertedIds = await this.query().insert(model.all());

    return this.whereKey(insertedIds[0]).first();
  }

  /**
   * Find first model for the given conditions.
   */
  async first(wheres: Where[] = []): Promise<Fluent> {
    return new Fluent(await this.where(wheres).makeQuery().first());
  }

  /**
   * Store given model into the storage.
   */
  async update(model: Fluent): Promise<Fluent> {
    const data = model.all();

    delete data[model.getKeyName()];

    await this.query().where(model.getKeyName(), model.getKey()).update(data);

    return Promise.resolve(model);
  }

  /**
   * Delete model for the given key.
   */
  async delete(key: string | number): Promise<void> {
    await this.whereKey(key).makeQuery().delete();
  }

  /**
   * Get new query with wheres and orders.
   */
  public makeQuery(): Knex.QueryBuilder {
    return this.applyWheres(this.query().orderBy(this.prepareOrdersForQuery()));
  }

  /**
   * Prepare raw orders for query.
   */
  protected prepareOrdersForQuery() {
    return this.orders.map((order) => {
      return {
        column: order.key,
        order: order.direction === Direction.DESC ? 'desc' : 'asc',
      };
    });
  }

  /**
   * Apply wheres to the query.
   */
  protected applyWheres(query: Knex.QueryBuilder): Knex.QueryBuilder {
    this.wheres.forEach(({ key, operator, value }) => {
      if (![null, undefined].includes(value)) {
        query.where(key, operator, value);
      } else if ([Operator.eq, Operator.in].includes(operator)) {
        query.whereNull(key);
      } else {
        query.whereNotNull(key);
      }
    });

    return query;
  }

  /**
   * Get the base query.
   */
  protected query(): Knex.QueryBuilder {
    return this.connection().table(this.tableName()).debug(this.debug());
  }

  /**
   * Get the database table name.
   */
  public tableName(): string {
    return plural(singular(slugify(this.constructor.name, '_')));
  }

  /**
   * Create new instance of model.
   */
  model(): Model {
    return new Fluent();
  }

  /**
   * Get the debugging state.
   */
  protected debug(): boolean {
    return false;
  }

  /**
   * Get the knex connection.
   */
  public abstract connection(): Knex;
}
