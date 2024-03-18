import { Field } from '../Fields';
import { Filter } from '../Filters';
import AvonRequest from '../Http/Requests/AvonRequest';
import { Repository } from '../Repositories';
import { AbstractMixable, Model, Operator } from '../Contracts';

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
      return this.isValidNullValue(value)
        ? this.applyNullFilter(request, queryBuilder)
        : this.field.applyFilter(request, queryBuilder, this.parseValue(value));
    }

    /**
     * Determine if the given value is considered a valid null value if the field supports them.
     */
    public isValidNullValue(value: any): boolean {
      return this.field.isValidNullValue(value);
    }

    /**
     * Apply filter for valid null values.
     */
    public applyNullFilter(
      request: AvonRequest,
      queryBuilder: Repository<Model>,
    ): any {
      return queryBuilder.where({
        key: this.field.filterableAttribute(request),
        operator: Operator.eq,
        value: this.field.nullValue(),
      });
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
