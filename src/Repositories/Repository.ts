import {
  type AnyRecord,
  type AnyValue,
  type Model,
  Operator,
  Optional,
  type Order,
  type QueryModifierCallback,
  type SearchCollection,
  type Transaction,
  type TransactionCallback,
  type Where,
} from '../Contracts';
import { Fluent } from '../Models';

export default abstract class Repository<TModel extends Model = Model> {
  /**
   * List of applied conditions.
   */
  public wheres: Where[] = [];

  /**
   * List of applied orderings.
   */
  public orders: Order[] = [];

  /**
   * List of query modifier callbacks.
   */
  public modifiers: QueryModifierCallback[] = [];

  /**
   * The transaction instance.
   */
  public _transaction?: Transaction;

  /**
   * Run a transaction on the storage.
   */
  public async transaction<V>(
    callback: TransactionCallback<V, this>,
  ): Promise<V> {
    const trx = await this.prepareTransaction();
    // update current transaction
    this.setTransaction(trx);

    try {
      // Execute the callback within the transaction
      const result = await callback(this, trx);

      // Commit the transaction if it exists
      if (trx !== undefined) {
        await trx.commit();
      }

      return result;
    } catch (error) {
      // Rollback the transaction if an error occurs
      if (trx !== undefined) {
        await trx.rollback();
      }
      throw error;
    }
  }

  /**
   * Set the transaction instance.
   */
  public setTransaction(transaction?: Transaction) {
    this._transaction = transaction;

    return this;
  }

  /**
   * Get the transaction instance.
   */
  public getTransaction(): Transaction | undefined {
    return this._transaction;
  }
  /**
   * Indicates whether the transaction is running or not.
   */
  public runningInTransaction(): boolean {
    return this.getTransaction() !== undefined;
  }

  /**
   * Start new transaction.
   */
  public async prepareTransaction(): Promise<Transaction> {
    return new (class implements Transaction {
      commit(value?: AnyValue) {
        return value;
      }
      rollback(error?: AnyValue) {
        return error;
      }
    })();
  }

  /**
   * Apply condition('s) to the repository.
   */
  public where(where: Where | Where[]): this {
    const wheres = Array.isArray(where) ? where : [where];

    wheres.forEach((where) => this.wheres.push(where));

    return this;
  }

  /**
   * Set conditions on the repository.
   */
  setWheres(wheres: Where[]): this {
    this.wheres = wheres;

    return this;
  }

  /**
   * Get all conditions from the repository.
   */
  getWheres(): Where[] {
    return this.wheres;
  }

  /**
   * Apply condition to repository.
   */
  public order(order: Order | Order[]): this {
    const orders = Array.isArray(order) ? order : [order];

    orders.forEach((order) => this.orders.push(order));

    return this;
  }

  /**
   * Set orders on the repository.
   */
  setOrders(orders: Order[]): this {
    this.orders = orders;

    return this;
  }

  /**
   * Get all orders from the repository.
   */
  getOrders(): Order[] {
    return this.orders;
  }

  /**
   * Modify underlying query before execute.
   */
  public modify<T>(modifier: QueryModifierCallback<T>) {
    this.modifiers.push(modifier);

    return this;
  }

  /**
   * Find model for the given key.
   */
  async find(key: string | number): Promise<TModel | undefined> {
    return this.whereKey(key).first();
  }

  /**
   * Apply primary key condition
   */
  public whereKey(key: string | number): this {
    return this.where({
      key: this.model().getKeyName(),
      value: key,
      operator: Operator.eq,
    });
  }

  /**
   * Apply primary key condition
   */
  public whereKeys(keys: Array<string | number>): this {
    return this.where({
      key: this.model().getKeyName(),
      value: keys,
      operator: Operator.in,
    });
  }

  /**
   * Fill data into model.
   */
  public fillModel(result: AnyRecord): TModel {
    const Constructor = this.model().constructor.prototype.constructor;

    return new Constructor(result);
  }

  /**
   * Search storage for given query string.
   */
  abstract search(
    search: string,
    page?: number,
    perPage?: number,
  ): Promise<SearchCollection>;

  /**
   * Find all model's for the given conditions.
   */
  abstract all(wheres?: Where[]): Promise<TModel[]>;

  /**
   * Find first model for the given conditions.
   */
  abstract first(wheres?: Where[]): Promise<TModel | undefined>;

  /**
   * Store given model into the storage.
   */
  abstract store(model: TModel): Promise<TModel>;

  /**
   * Update the given model in storage.
   */
  abstract update(model: TModel): Promise<TModel>;

  /**
   * Delete model for the given key.
   */
  abstract delete(key: string | number): Promise<void>;

  /**
   * Create new instance of model.
   */
  abstract model(): TModel;
}
