import collect from 'collect.js';
import {
  type AnyValue,
  type Model,
  type OpenApiSchema,
  Operator,
} from '../../Contracts';
import { Filter } from '../../Filters';
import type AvonRequest from '../../Http/Requests/AvonRequest';
import FilterableFields from '../../Mixins/FilterableFields';
import type { Repository } from '../../Repositories';
import type Relation from '../Relation';

export default class BelongsToFilter extends FilterableFields(Filter) {
  /**
   * The help text for the filter.
   */
  public helpText?: string = 'Filter records by related resource IDs.';

  constructor(public field: Relation) {
    super();
  }

  /**
   * Apply the filter into the given repository.
   */
  public async apply(
    request: AvonRequest,
    queryBuilder: Repository<Model>,
    value: AnyValue,
  ): Promise<AnyValue> {
    if (typeof this.field.filterableCallback === 'function') {
      super.apply(request, queryBuilder, value);
    } else if (this.field.filterableCallback) {
      queryBuilder.where({
        key: this.field.foreignKeyName(request),
        operator: Operator.in, //@ts-ignore
        value: collect(value).filter().all(),
      });
    }
  }

  public filterableAttribute(request: AvonRequest): string {
    return this.field.foreignKeyName(request);
  }

  public parseValue(value: AnyValue) {
    //@ts-ignore
    return collect(value).filter().all();
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

  public isValidNullValue(value: AnyValue): boolean {
    //@ts-ignore
    return collect(value).filter().isEmpty();
  }
}
