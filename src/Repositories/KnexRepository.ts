import type { Knex } from 'knex';
import { plural, singular } from 'pluralize';
import {
  type AnyRecord,
  Direction,
  type Model,
  Operator,
  type Optional,
  type PrimaryKey,
  type SearchCollection,
  type Where,
} from '../Contracts';
import { Fluent } from '../Models';
import { isNullish, slugify } from '../helpers';
import Repository from './Repository';

export default abstract class KnexRepository<
  TModel extends Model = Fluent,
> extends Repository<TModel> {
  /**
   * List of selectable columns.
   */
  protected columns = ['*'];

  /**
   * The columns that should be searched.
   */
  protected searches: Array<string | Knex.Raw> = [];

  /**
   * Start new transaction.
   */
  public async prepareTransaction() {
    return this.connection().transaction();
  }

  /**
   * Search storage for given query string.
   */
  async search(
    search: string,
    page = 1,
    perPage = 15,
  ): Promise<SearchCollection<Fluent>> {
    const query = this.performSearch(this.makeQuery(), search);
    const offset = (page - 1) * perPage > 0 ? (page - 1) * perPage : 0;
    const [count] = await query
      .clone()
      .clearSelect()
      .clearGroup()
      .count(`${this.tableName()}.${this.model().getKeyName()} as count`);

    const data = await this.selectColumns(query.limit(perPage).offset(offset));

    return {
      ...count,
      items: data.map((item: AnyRecord) => this.fillModel(item)),
    };
  }

  /**
   * Perform searches on the given item.
   */
  protected performSearch(
    query: Knex.QueryBuilder,
    search: string,
  ): Knex.QueryBuilder {
    if (isNullish(search)) {
      return query;
    }
    // only apply when search value is valid
    return query.where((whereQuery) => {
      const searchValue = search.match(/%/) ? search : `%${search}%`;
      this.searchableColumns().forEach((searchable) => {
        if (typeof searchable === 'string') {
          whereQuery.orWhere(searchable, 'LIKE', searchValue);
        } else {
          whereQuery.orWhere(searchable, 'LIKE', searchValue);
        }
      });

      return whereQuery;
    });
  }

  /**
   * Get the searchable columns for the resource.
   */
  public searchableColumns() {
    return this.searches.length ? this.searches : [this.model().getKeyName()];
  }

  /**
   * Find all model's for the given conditions.
   */
  async all(wheres: Where[] = []): Promise<TModel[]> {
    const data = await this.selectColumns(this.where(wheres).makeQuery());

    return data.map((item: AnyRecord) => this.fillModel(item));
  }

  /**
   * Get the select columns.
   */
  protected selectColumns(query: Knex.QueryBuilder): Knex.QueryBuilder {
    return query.select(
      this.columns.map((column) => this.getQualifiedColumnName(column)),
    );
  }

  /**
   * Get list of selectable columns.
   */
  public select(columns: string[] = ['*']) {
    this.columns = columns;

    return this;
  }

  /**
   * Find first model for the given conditions.
   */
  async first(wheres: Where[] = []): Promise<Optional<TModel>> {
    return this.parseResult(await this.where(wheres).makeQuery().first());
  }

  /**
   * Store given model into the storage.
   */
  async store(model: TModel): Promise<TModel> {
    const insertedIds = await this.query().insert(model.getAttributes());

    return this.find(insertedIds[0]) as unknown as TModel;
  }

  /**
   * Store given model into the storage.
   */
  async update(model: TModel): Promise<TModel> {
    const data = { ...model.getAttributes() };
    // remove primary key
    delete data[model.getKeyName()];
    // update storage
    await this.query().where(model.getKeyName(), model.getKey()).update(data);

    return model;
  }

  /**
   * Delete model for the given key.
   */
  async delete(key: PrimaryKey): Promise<void> {
    await this.whereKey(key).makeQuery().delete();
  }

  /**
   * Get new query with wheres and orders.
   */
  public makeQuery(): Knex.QueryBuilder {
    return this.applyModifiers(
      this.applyWheres(this.query().orderBy(this.prepareOrdersForQuery())),
    );
  }

  /**
   * Prepare raw orders for query.
   */
  protected prepareOrdersForQuery() {
    return this.orders.map((order) => {
      return {
        column: this.getQualifiedColumnName(order.key),
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
        query.where(
          this.getQualifiedColumnName(key),
          operator,
          Operator.in === operator && !Array.isArray(value) ? [value] : value,
        );
      } else if ([Operator.eq, Operator.in].includes(operator)) {
        query.whereNull(this.getQualifiedColumnName(key));
      } else {
        query.whereNotNull(this.getQualifiedColumnName(key));
      }
    });

    return query;
  }

  /**
   * Get fully qualified column name.
   */
  public getQualifiedColumnName(columnName: string) {
    return `${this.tableName()}.${columnName}`;
  }

  /**
   * Apply wheres to the query.
   */
  protected applyModifiers(query: Knex.QueryBuilder): Knex.QueryBuilder {
    this.modifiers.forEach((modifier) => modifier(query));

    return query;
  }

  /**
   * Get the base query.
   */
  protected query(): Knex.QueryBuilder {
    const query = this.connection().table(this.tableName()).debug(this.debug());
    const transaction = this.getTransaction();

    return transaction
      ? query.transacting(transaction as Knex.Transaction)
      : query;
  }

  /**
   * Get the database table name.
   */
  public tableName(): string {
    return plural(singular(slugify(this.constructor.name, '_')));
  }

  /**
   * Parse the query result.
   */
  public parseResult(result?: TModel): TModel | undefined {
    return result ? this.fillModel(result) : result;
  }

  /**
   * Create new instance of model.
   */
  model(): TModel {
    return new Fluent() as unknown as TModel;
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
