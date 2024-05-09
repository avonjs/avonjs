import AvonRequest from '../Http/Requests/AvonRequest';
import { Repository } from '../Repositories';
import { OpenApiSchema } from '../Contracts';

import Filter from './Filter';
import collect from 'collect.js';

export default class PrimaryKey extends Filter {
  constructor(...args: readonly []) {
    super(...args);
    this.nullable(true, (value) => collect(value).isEmpty());
  }

  /**
   * Apply the filter into the given repository.
   */
  apply(request: AvonRequest, repository: Repository, value: any): any {
    if (!this.isValidNullValue(value)) {
      return repository.whereKey(value);
    }
  }

  /**
   * Get the swagger-ui schema.
   */
  schema(request: AvonRequest): OpenApiSchema {
    return {
      type: 'array',
      items: { type: 'number' },
      nullable: this.isNullable(),
    };
  }
}
