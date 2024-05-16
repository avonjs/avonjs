import FilterableFields from '../../Mixins/FilterableFields';
import { Filter } from '../../Filters';
import Relation from '../Relation';
import { Model, OpenApiSchema, Operator } from '../../Contracts';
import AvonRequest from '../../Http/Requests/AvonRequest';
import { Repository } from '../../Repositories';
import collect from 'collect.js';

export default class BelongsToFilter extends FilterableFields(Filter) {
  constructor(public field: Relation) {
    super();
  }

  /**
   * Apply the filter into the given repository.
   */
  public async apply(
    request: AvonRequest,
    queryBuilder: Repository<Model>,
    value: any,
  ): Promise<any> {
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

  public parseValue(value: any) {
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

  public isValidNullValue(value: any): boolean {
    //@ts-ignore
    return collect(value).filter().isEmpty();
  }
}
