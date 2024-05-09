import collect from 'collect.js';
import { FilterableCallback, Model, ResolveCallback } from '../Contracts';
import { Filter } from '../Filters';
import AvonRequest from '../Http/Requests/AvonRequest';
import { Repository } from '../Repositories';
import ResourceIdFilter from './Filters/ResourceIdFilter';
import Integer from './Integer';

export default class ID extends Integer {
  constructor(attribute?: string, resolveCallback?: ResolveCallback) {
    super(attribute ?? 'id', resolveCallback);
    this.exceptOnForms().orderable().filterable().showOnAssociation();
  }

  /**
   * Make the field filter.
   */
  public makeFilter(request: AvonRequest): Filter {
    return new ResourceIdFilter(this);
  }

  /**
   * Define the default filterable callback.
   */
  public defaultFilterableCallback(): FilterableCallback {
    return (
      request: AvonRequest,
      repository: Repository<Model>,
      values: number[],
    ) => {
      repository.whereKeys(collect(values).all());
    };
  }
}
