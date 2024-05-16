import AvonRequest from '../Http/Requests/AvonRequest';
import Filter from './Filter';
import { Model, OpenApiSchema, Operator } from '../Contracts';
import { Repository } from '../Repositories';

export default abstract class BooleanFilter extends Filter {
  /**
   * Apply the filter into the given repository.
   */
  public apply(
    request: AvonRequest,
    repository: Repository<Model>,
    value: unknown,
  ): any {
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
  public parseBoolean(value: any) {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    } else if (typeof value === 'number') {
      return value === 1;
    } else if (typeof value === 'boolean') {
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
