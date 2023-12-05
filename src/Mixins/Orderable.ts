import AvonRequest from '../Http/Requests/AvonRequest';
import { Ordering } from '../Orderings';
import { Repository } from '../Repositories';
import {
  AbstractMixable,
  OrderingCallback,
  Model,
  Operator,
} from '../contracts';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class Orderable extends Parent {
    /**
     * The callback to be used for the field's default value.
     */
    public orderableCallback?: OrderingCallback;

    /**
     * Apply the order to the given query.
     */
    public applyOrdering(
      request: AvonRequest,
      repository: Repository<Model>,
      value: any,
    ): any {
      this.orderableCallback?.apply(this, [request, repository, value]);
    }

    /**
     * Make the field order.
     */
    public resolveOrdering(request: AvonRequest): Ordering | undefined {
      // prevent resolving fields that do not use for ordering
      if (this.orderableCallback != null) {
        return this.makeOrdering(request);
      }
    }

    /**
     * The callback used to determine if the field is orderable.
     */
    public orderable(callback?: OrderingCallback): this {
      this.orderableCallback = callback ?? this.defaultOrderingCallback();

      return this;
    }

    /**
     * Define the default orderable callback.
     */
    public defaultOrderingCallback(): OrderingCallback {
      return (
        request: AvonRequest,
        repository: Repository<Model>,
        value: any,
      ) => {
        repository.where({
          key: this.orderableAttribute(request),
          operator: Operator.eq,
          value,
        });
      };
    }

    /**
     * Make the field order.
     */
    public abstract makeOrdering(request: AvonRequest): Ordering;

    /**
     * Define orderable attribute.
     */
    public abstract orderableAttribute(request: AvonRequest): string;
  }

  return Orderable;
};
