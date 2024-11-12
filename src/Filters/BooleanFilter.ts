import { type Model, type OpenApiSchema, Operator } from '../Contracts';
import type AvonRequest from '../Http/Requests/AvonRequest';
import type { Repository } from '../Repositories';
import Filter from './Filter';

export default abstract class BooleanFilter extends Filter {
  /**
   * The help text for the filter.
   */
  public helpText?: string = 'Select value to filter records.';

  /**
   * Apply the filter into the given repository.
   */
  public apply(
    request: AvonRequest,
    repository: Repository<Model>,
    value: never,
  ): void {
    repository.where({
      key: this.filterableAttribute(request),
      operator: Operator.eq,
      value: this.isValidNullValue(value) ? null : this.parseBoolean(value),
    });
  }

  /**
   * Get the attribute that the boolean filter should perform on it.
   */
  abstract filterableAttribute(request: AvonRequest): string;

  /**
   * Parse the input value into a boolean.
   */
  public parseBoolean(value: never): boolean {
    if (typeof value === 'string') {
      return (value as string).toLowerCase() === 'true';
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return false;
  }

  /**
   * Get the swagger-ui schema.
   */
  schema(request: AvonRequest): OpenApiSchema {
    return {
      type: 'boolean',
      nullable: this.isNullable(),
    };
  }
}
