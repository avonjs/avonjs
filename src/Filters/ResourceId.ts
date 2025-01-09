import type { OpenApiSchema, PrimaryKey } from '../Contracts';
import type AvonRequest from '../Http/Requests/AvonRequest';
import type { Repository } from '../Repositories';

import collect from 'collect.js';
import Filter from './Filter';

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
  apply(request: AvonRequest, repository: Repository, value: PrimaryKey): void {
    if (!this.isValidNullValue(value)) {
      repository.whereKeys(collect<PrimaryKey>(value).all());
    }
  }

  /**
   * Get the swagger-ui schema.
   */
  schema(request: AvonRequest): OpenApiSchema {
    return {
      type: 'array',
      items: { $ref: '#components/schemas/PrimaryKey' },
      nullable: this.isNullable(),
    };
  }
}
