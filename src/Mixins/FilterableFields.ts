import {
  type AbstractMixable,
  type AnyValue,
  type Model,
  Operator,
} from '../Contracts';
import type { Field } from '../Fields';
import type { Filter } from '../Filters';
import type AvonRequest from '../Http/Requests/AvonRequest';
import type { Repository } from '../Repositories';

export default <T extends AbstractMixable<Filter>>(Parent: T) => {
  abstract class FilterableFields extends Parent {
    abstract field: Field;

    /**
     * Apply the filter into the given repository.
     */
    public async apply(
      request: AvonRequest,
      queryBuilder: Repository<Model>,
      value: AnyValue,
    ) {
      if (typeof this.field.filterableCallback === 'function') {
        this.isValidNullValue(value)
          ? this.applyNullFilter(request, queryBuilder)
          : this.field.applyFilter(
              request,
              queryBuilder,
              this.parseValue(value),
            );
      } else if (this.field.filterableCallback) {
        //@ts-ignore
        super.apply(request, queryBuilder, value);
      }
    }

    /**
     * Get the attribute that the date filter should perform on it.
     */
    public filterableAttribute(request: AvonRequest): string {
      return this.field.filterableAttribute(request);
    }

    /**
     * Determine if the given value is considered a valid null value if the field supports them.
     */
    public isValidNullValue(value: AnyValue): boolean {
      return this.field.isValidNullValue(value);
    }

    /**
     * Determine if the field supports null values.
     */
    public isNullable(): boolean {
      return this.field.isNullable();
    }

    /**
     * Apply filter for valid null values.
     */
    public applyNullFilter(
      request: AvonRequest,
      queryBuilder: Repository<Model>,
    ) {
      return queryBuilder.where({
        key: this.field.filterableAttribute(request),
        operator: Operator.eq,
        value: this.field.nullValue(),
      });
    }

    /**
     * Parse the value given from request.
     */
    public parseValue(value: AnyValue) {
      return value;
    }

    /**
     * Get the query parameter key for filter.
     */
    public key(): string {
      return `${this.field.constructor.name}:${this.field.attribute}`;
    }
  }

  return FilterableFields;
};
