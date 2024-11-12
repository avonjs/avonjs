import { type AbstractMixable, Direction, type Model } from '../Contracts';
import type { Field } from '../Fields';
import type AvonRequest from '../Http/Requests/AvonRequest';
import type { Ordering } from '../Orderings';
import type { Repository } from '../Repositories';

export default <T extends AbstractMixable<Ordering>>(Parent: T) => {
  abstract class OrderableFields extends Parent {
    /**
     * The field instance.
     */
    abstract field: Field;

    /**
     * Indicates if the field is nullable.
     */
    public acceptsNullValues = true;

    /**
     * Apply the filter into the given repository.
     */
    public async apply(
      request: AvonRequest,
      queryBuilder: Repository<Model>,
      direction: Direction,
    ) {
      if (
        !Object.values(Direction).includes(direction) &&
        this.isValidNullValue(direction)
      ) {
        return;
      }

      return this.field.applyOrdering(
        request,
        queryBuilder,
        Direction.ASC === direction ? Direction.ASC : Direction.DESC,
      );
    }

    /**
     * Get the query parameter key for filter.
     */
    public key(): string {
      return `${this.field.constructor.name}:${this.field.attribute}`;
    }
  }

  return OrderableFields;
};
