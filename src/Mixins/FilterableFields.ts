import { Field } from '../Fields';
import { Filter } from '../Filters';
import AvonRequest from '../Http/Requests/AvonRequest';
import { Repository } from '../Repositories';
import { AbstractMixable, Model } from '../Contracts';

export default <T extends AbstractMixable<Filter>>(Parent: T) => {
  abstract class FilterableFields extends Parent {
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
      value: any,
    ): Promise<any> {
      if (this.isValidNullValue(value)) {
        return;
      }

      return this.field.applyFilter(
        request,
        queryBuilder,
        this.parseValue(value),
      );
    }

    /**
     * Parse the value given from request.
     */
    public parseValue(value: any) {
      return value;
    }

    /**
     * Get the query parameter key for filter.
     */
    public key(): string {
      return this.field.constructor.name + ':' + this.field.attribute;
    }
  }

  return FilterableFields;
};
