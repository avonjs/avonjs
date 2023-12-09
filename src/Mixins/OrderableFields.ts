import { Field } from '../Fields';
import { Ordering } from '../Orderings';
import AvonRequest from '../Http/Requests/AvonRequest';
import { Repository } from '../Repositories';
import { AbstractMixable, Direction, Model } from '../contracts';

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
      repository: Repository<Model>,
      direction: Direction,
    ): Promise<any> {
      if (
        !Object.values(Direction).includes(direction) &&
        this.isValidNullValue(direction)
      ) {
        return;
      }

      return this.field.applyOrdering(
        request,
        repository,
        Direction.ASC === direction ? Direction.ASC : Direction.DESC,
      );
    }

    /**
     * Get the query parameter key for filter.
     */
    public key(): string {
      return this.field.constructor.name + ':' + this.field.attribute;
    }
  }

  return OrderableFields;
};
