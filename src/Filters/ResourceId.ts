import AvonRequest from '../Http/Requests/AvonRequest';
import { Repository } from '../Repositories';
import { OpenApiSchema } from '../Contracts';

import Filter from './Filter';
import collect from 'collect.js';

export default class ResourceId extends Filter {
  /**
   * The help text for the filter.
   */
  public helpText?: string = 'Enter the resource IDs to filter records.';

  constructor(...args: readonly []) {
    super(...args);
    this.nullable(true, (value) => collect(value).isEmpty());
  }

  /**
   * Apply the filter into the given repository.
   */
  apply(request: AvonRequest, repository: Repository, value: any): any {
    if (!this.isValidNullValue(value)) {
      return repository.whereKeys(collect<string | number>(value).all());
    }
  }

  /**
   * Get the swagger-ui schema.
   */
  schema(request: AvonRequest): OpenApiSchema {
    return {
      type: 'array',
      items: { oneOf: [{ type: 'number' }, { type: 'string' }] },
      nullable: this.isNullable(),
    };
  }
}
