import { Knex } from 'knex';
import { plural, singular } from 'pluralize';
import { Fluent } from '../Models';
import { Model, SearchCollection, Where, Direction } from '../Contracts';
import { slugify } from '../helpers';
import Repository from './Repository';

export default abstract class KnexRepository extends Repository<Model> {
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
    const query = this.query();

    this.wheres.forEach((where) => {
      query.where(where.key, where.operator, where.value);
    });

    query.orderBy(
      this.orders.map((order) => {
        return {
          column: order.key,
          order: order.direction === Direction.DESC ? 'desc' : 'asc',
        };
      }),
    );

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
