import AvonRequest from '../Http/Requests/AvonRequest';
import { Repository } from '../Repositories';
import { OpenApiSchema, Operator } from '../Contracts';

import Filter from './Filter';

export default abstract class TextFilter extends Filter {
  /**
   * Apply the filter into the given repository.
   */
  apply(request: AvonRequest, repository: Repository, value: string): any {
    repository.where({
      key: this.filterableAttribute(request),
      operator: this.isValidNullValue(value) ? Operator.eq : Operator.like,
      value: this.isValidNullValue(value)
        ? null
        : this.formatSearchValue(value),
    });
  }

  /**
   * Get the attribute that the date filter should perform on it.
   */
  abstract filterableAttribute(request: AvonRequest): string;

  /**
   * Format given value for search.
   */
  public formatSearchValue(value: string) {
    return value.match(/%/) ? value : `%${value}%`;
  }

  /**
   * Get the swagger-ui schema.
   */
  schema(request: AvonRequest): OpenApiSchema {
    return {
      type: 'string',
      nullable: this.isNullable(),
    };
  }
}
