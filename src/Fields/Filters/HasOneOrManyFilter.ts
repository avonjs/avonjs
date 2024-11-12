import { type AnyValue, type Model, Operator } from '../../Contracts';
import type AvonRequest from '../../Http/Requests/AvonRequest';
import type { Repository } from '../../Repositories';
import type Relation from '../Relation';
import BelongsToFilter from './BelongsToFilter';

export default class HasOneOrManyFilter extends BelongsToFilter {
  constructor(public field: Relation) {
    super(field);
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
      this.field.applyFilter(request, queryBuilder, this.parseValue(value));
    } else if (this.field.filterableCallback) {
      const related = await this.field.relatedResource
        .resolveRepository(request)
        .whereKeys(Array.isArray(value) ? value : [value])
        .all();

      queryBuilder.where({
        key: this.field.ownerKeyName(request),
        value: related.map((model) => {
          return model.getAttribute(this.field.foreignKeyName(request));
        }),
        operator: Operator.in,
      });
    }
  }

  public filterableAttribute(request: AvonRequest): string {
    return this.field.ownerKeyName(request);
  }
}
