import AvonRequest from '../Http/Requests/AvonRequest';
import Filter from './Filter';
import { Model, OpenApiSchema, Operator } from '../Contracts';
import { Repository } from '../Repositories';
export default abstract class SelectFilter extends Filter {
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
    value: unknown,
  ): any {
    if (this.options().includes(value) || this.isValidNullValue(value)) {
      repository.where({
        key: this.filterableAttribute(request),
        operator: Operator.eq,
        value: this.isValidNullValue(value) ? null : value,
      });
    }
  }

  /**
   * Get the attribute that the boolean filter should perform on it.
   */
  abstract filterableAttribute(request: AvonRequest): string;

  /**
   * Get the possible filtering values.
   */
  public options(): any[] {
    return [];
  }

  /**
   * Get the swagger-ui schema.
   */
  schema(request: AvonRequest): OpenApiSchema {
    return {
      type: 'array',
      items: {
        oneOf: [{ type: 'string' }, { type: 'number' }],
        enum: this.options(),
      },
      nullable: this.isNullable(),
    };
  }
}
