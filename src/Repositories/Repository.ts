import {
  Model,
  Where,
  Order,
  Operator,
  SearchCollection,
  TransactionCallback,
} from '../Contracts';

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
   * Run transaction on the storage.
   */
  public async transaction<T>(
    callback: TransactionCallback<T, this>,
  ): Promise<T> {
    return Promise.resolve(callback(this));
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
  public fillModel(result: Record<string, any>): TModel {
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
