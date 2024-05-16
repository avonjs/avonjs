import { Model, Operator } from '../../Contracts';
import AvonRequest from '../../Http/Requests/AvonRequest';
import { Repository } from '../../Repositories';
import Relation from '../Relation';
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
    value: any,
  ): Promise<any> {
    if (typeof this.field.filterableCallback === 'function') {
      this.field.applyFilter(request, queryBuilder, this.parseValue(value));
    } else if (this.field.filterableCallback) {
      const related = await this.field.relatedResource
        .repository()
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
